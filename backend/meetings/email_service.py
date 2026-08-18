"""
Email service.

Emails are sent through Django's mail layer, so the provider/backend is fully
configurable through environment variables (``EMAIL_BACKEND``, ``EMAIL_HOST``,
etc.). Failures are logged but never crash the booking flow.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _send(to_email, subject, message):
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email])
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def _booking_lines(booking):
    event_type = booking.event_type
    return (
        f"Event: {event_type.title}\n"
        f"Date/time: {booking.start_time.isoformat()} - {booking.end_time.isoformat()}\n"
        f"Location: {event_type.location or 'Google Meet'}\n"
        f"Meet link: {booking.meet_link or 'See your calendar invite'}\n"
    )


def send_booking_confirmation(booking):
    """Notify the invitee that their booking was confirmed."""
    subject = f"Confirmed: {booking.event_type.title}"
    message = (
        f"Hi {booking.invitee_name},\n\n"
        f"Your meeting is booked.\n\n"
        f"{_booking_lines(booking)}\n"
        f"If you need to cancel, keep this token:\n{booking.cancellation_token}\n\n"
        f"Thanks!"
    )
    _send(booking.invitee_email, subject, message)


def send_booking_cancellation(booking):
    """Notify the invitee that a booking was cancelled."""
    subject = f"Cancelled: {booking.event_type.title}"
    message = (
        f"Hi {booking.invitee_name},\n\n"
        f"Your meeting was cancelled.\n\n"
        f"{_booking_lines(booking)}\n"
        f"Sorry for any inconvenience."
    )
    _send(booking.invitee_email, subject, message)


def send_booking_reminder(booking):
    """Notify the invitee that a booking is coming up soon."""
    subject = f"Reminder: {booking.event_type.title}"
    message = (
        f"Hi {booking.invitee_name},\n\n"
        f"This is a reminder that your meeting is coming up.\n\n"
        f"{_booking_lines(booking)}\n"
        f"See you there!"
    )
    _send(booking.invitee_email, subject, message)