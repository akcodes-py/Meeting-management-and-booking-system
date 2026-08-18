"""
Business logic for availability, booking and cancellation.

Views stay thin; the real work happens here.
"""

import hmac
import math
import secrets
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import transaction
from django.utils import timezone as django_timezone

from calendar_integration import services as google_services

from .models import Booking, EventType

class BookingError(Exception):
    """Base error for booking service."""

class BookingValidationError(BookingError):
    """The requested booking is invalid."""

class BookingConflict(BookingError):
    """The slot is no longer available."""

class BookingGoogleError(BookingError):
    """A Google Calendar API call failed."""

class BookingPermissionDenied(BookingError):
    """The caller is not allowed to perform this action."""

def _merge_intervals(intervals):
    """Merge overlapping/sorted intervals into a list of non-overlapping ones."""
    if not intervals:
        return []
    intervals = sorted(intervals, key=lambda x: x[0])
    merged = [list(intervals[0])]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return [(start, end) for start, end in merged]

def _subtract_intervals(intervals, to_remove):
    """Remove ``to_remove`` intervals from ``intervals``."""
    intervals = _merge_intervals(intervals)
    to_remove = _merge_intervals(to_remove)
    result = []
    for start, end in intervals:
        current = start
        for remove_start, remove_end in to_remove:
            if remove_end <= current or remove_end <= start:
                continue
            if remove_start >= end:
                break
            if remove_start > current:
                result.append((current, min(remove_start, end)))
            current = max(current, remove_end)
            if current >= end:
                break
        if current < end:
            result.append((current, end))
    return result

def _round_up(dt, step):
    """Round a datetime up to the next multiple of ``step``."""
    seconds = int(step.total_seconds())
    ts = dt.timestamp()
    rounded = math.ceil(ts / seconds) * seconds
    return datetime.fromtimestamp(rounded, tz=dt.tzinfo)

def _db_busy_periods(event_type, window_start, window_end):
    """Return already-booked (PENDING/CONFIRMED) slots as busy periods."""
    bookings = Booking.objects.filter(
        event_type=event_type,
        status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
        start_time__lt=window_end,
        end_time__gt=window_start,
    )
    return [(b.start_time, b.end_time) for b in bookings]

def get_available_slots(event_type, start_date, end_date, busy_periods=None):
    """
    Compute available booking slots for an event type between two dates.

    ``start_date``/``end_date`` are ``datetime.date`` objects. If
    ``busy_periods`` is given it is used instead of querying Google (mainly
    for unit tests). Returns a list of ``(start, end)`` aware datetime tuples.
    """
    user = event_type.user
    try:
        tz = ZoneInfo(user.timezone)
    except Exception:
        tz = ZoneInfo("UTC")

    rules = list(event_type.availability_rules.all())

    free_windows = []
    day = start_date
    while day <= end_date:
        windows = []
        for rule in rules:
            if rule.weekday != day.weekday():
                continue
            start = datetime.combine(day, rule.start_time, tzinfo=tz)
            end = datetime.combine(day, rule.end_time, tzinfo=tz)
            if end > start:
                windows.append((start, end))
        free_windows.extend(_merge_intervals(windows))
        day += timedelta(days=1)

    if not free_windows:
        return []

    window_start = free_windows[0][0]
    window_end = free_windows[-1][1]

    if busy_periods is None:
        busy_periods = google_services.get_busy_periods(user, window_start, window_end)
    busy = list(busy_periods) + _db_busy_periods(event_type, window_start, window_end)

    open_windows = _subtract_intervals(free_windows, busy)

    duration = timedelta(minutes=event_type.duration)
    buffer_before = timedelta(minutes=event_type.buffer_before)
    buffer_after = timedelta(minutes=event_type.buffer_after)
    step = timedelta(minutes=settings.AVAILABILITY_SLOT_STEP_MINUTES)
    now = django_timezone.now()

    slots = []
    for start, end in open_windows:
        usable_start = start + buffer_before
        usable_end = end - buffer_after
        slot_start = _round_up(usable_start, step)
        while slot_start + duration <= usable_end:
            if slot_start >= now:
                slots.append((slot_start, slot_start + duration))
            slot_start += step

    return slots

def _within_availability(event_type, start, end):
    """True if the slot (plus buffers) fits inside a weekly rule window."""
    try:
        tz = ZoneInfo(event_type.user.timezone)
    except Exception:
        tz = ZoneInfo("UTC")

    local_start = start.astimezone(tz)
    buffer_before = timedelta(minutes=event_type.buffer_before)
    buffer_after = timedelta(minutes=event_type.buffer_after)

    for rule in event_type.availability_rules.filter(weekday=local_start.weekday()):
        window_start = datetime.combine(local_start.date(), rule.start_time, tzinfo=tz)
        window_end = datetime.combine(local_start.date(), rule.end_time, tzinfo=tz)
        if window_start <= start - buffer_before and end + buffer_after <= window_end:
            return True
    return False

def is_slot_available(event_type, start, end):
    """Re-check that a single slot is still free (DB + Google free/busy)."""
    buffer_before = timedelta(minutes=event_type.buffer_before)
    buffer_after = timedelta(minutes=event_type.buffer_after)

    if Booking.objects.filter(
        event_type=event_type,
        status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
        start_time__lt=end,
        end_time__gt=start,
    ).exists():
        return False

    busy = google_services.get_busy_periods(
        event_type.user,
        start - buffer_before,
        end + buffer_after,
    )
    for busy_start, busy_end in busy:
        if busy_start < end + buffer_after and busy_end > start - buffer_before:
            return False
    return True

def create_booking(event_type, invitee_name, invitee_email, start, end):
    """
    Create a booking for a validated event type and slot.

    Returns ``(booking, google_error)`` where ``google_error`` is a truthy
    string when the Google event could not be created (the booking is stored
    with status ``FAILED``).
    """
    duration = timedelta(minutes=event_type.duration)

    if end <= start:
        raise BookingValidationError("End time must be after start time.")
    if end - start != duration:
        raise BookingValidationError("The selected slot must match the event duration.")
    if start < django_timezone.now():
        raise BookingValidationError("The selected slot is in the past.")

    with transaction.atomic():
        event_type = EventType.objects.select_for_update().select_related("user").get(pk=event_type.pk)
        if not event_type.active:
            raise BookingValidationError("This event type is no longer accepting bookings.")

        if not _within_availability(event_type, start, end):
            raise BookingValidationError("The selected slot is outside your available hours.")

        try:
            available = is_slot_available(event_type, start, end)
        except google_services.GoogleAuthError as exc:
            raise BookingGoogleError(str(exc)) from exc

        if not available:
            raise BookingConflict("This slot was just taken. Please choose another time.")

        booking = Booking.objects.create(
            event_type=event_type,
            invitee_name=invitee_name,
            invitee_email=invitee_email,
            start_time=start,
            end_time=end,
            status=Booking.Status.PENDING,
            cancellation_token=secrets.token_urlsafe(32),
        )

        try:
            event = google_services.create_calendar_event(
                event_type.user, event_type, start, end, invitee_name, invitee_email
            )
        except google_services.GoogleApiError as exc:
            booking.status = Booking.Status.FAILED
            booking.save(update_fields=["status"])
            return booking, "Could not create the Google Calendar event."

        booking.google_event_id = event["id"]
        booking.meet_link = event.get("hangout_link", "")
        booking.status = Booking.Status.CONFIRMED
        booking.save()
        return booking, None

def cancel_booking(booking, user=None, token=None):
    """
    Cancel a booking as the host (authenticated) or the invitee (via token).
    """
    is_host = user is not None and user.is_authenticated and user.id == booking.event_type.user_id
    if not is_host:
        if not token or not hmac.compare_digest(token, booking.cancellation_token):
            raise BookingPermissionDenied("Invalid cancellation token.")

    if booking.status == Booking.Status.CANCELLED:
        return booking

    booking.status = Booking.Status.CANCELLED
    booking.save(update_fields=["status", "updated_at"])

    if booking.google_event_id:
        google_services.delete_calendar_event(booking.event_type.user, booking.google_event_id)

    return booking

def claim_due_reminders(user, window_hours=None):
    """
    Atomically mark upcoming confirmed bookings as reminded and return them.

    Only bookings starting within the next ``window_hours`` and not yet
    reminded are returned. Because the rows are locked and updated here, an
    n8n workflow re-run will never process the same booking twice.
    """
    hours = window_hours or settings.BOOKING_REMINDER_WINDOW_HOURS
    now = django_timezone.now()
    deadline = now + timedelta(hours=hours)

    with transaction.atomic():
        bookings = list(
            Booking.objects.select_for_update().filter(
                event_type__user=user,
                status=Booking.Status.CONFIRMED,
                reminder_sent=False,
                start_time__gt=now,
                start_time__lte=deadline,
            )
        )
        for booking in bookings:
            booking.reminder_sent = True
            booking.reminder_sent_at = now
            booking.save(update_fields=["reminder_sent", "reminder_sent_at"])

    return bookings