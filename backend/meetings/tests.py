"""Tests for event types, availability, the availability engine, booking and
cancellation. The availability engine and booking service are unit-tested
directly (Google API calls are mocked or injected)."""

import secrets
from datetime import datetime, time, timedelta, timezone
from unittest import mock

from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from calendar_integration import services as google_services

from . import services
from .models import AvailabilityRule, Booking, EventType
from .throttles import PublicRateThrottle

def make_user(username="alice", email=None):
    return User.objects.create_user(
        email=email or f"{username}@example.com",
        password="pass12345",
        name=username.title(),
        username=username,
    )

def make_event_type(user, slug="intro", **kwargs):
    defaults = {
        "title": "Intro Call",
        "duration": 30,
        "buffer_before": 0,
        "buffer_after": 0,
        "location": "Google Meet",
        "active": True,
    }
    defaults.update(kwargs)
    return EventType.objects.create(user=user, slug=slug, **defaults)

def make_rule(event_type, weekday, start="09:00", end="17:00"):
    return AvailabilityRule.objects.create(
        event_type=event_type,
        weekday=weekday,
        start_time=time.fromisoformat(start),
        end_time=time.fromisoformat(end),
    )

def auth(self, user):
    self.client.force_authenticate(user=user)

class EventTypeApiTests(APITestCase):
    def setUp(self):
        self.user = make_user()

    def test_create_event_type(self):
        auth(self, self.user)
        response = self.client.post(
            "/api/v1/event-types/",
            {"slug": "intro", "title": "Intro Call", "duration": 30},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EventType.objects.filter(user=self.user).count(), 1)

    def test_duplicate_slug_fails(self):
        make_event_type(self.user)
        auth(self, self.user)
        response = self.client.post(
            "/api/v1/event-types/",
            {"slug": "intro", "title": "Another", "duration": 15},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_only_returns_own(self):
        other = make_user("bob")
        make_event_type(self.user)
        make_event_type(other, slug="other")
        auth(self, self.user)
        response = self.client.get("/api/v1/event-types/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_and_delete(self):
        event_type = make_event_type(self.user)
        auth(self, self.user)
        response = self.client.patch(
            f"/api/v1/event-types/{event_type.id}/",
            {"title": "Renamed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Renamed")

        response = self.client.delete(f"/api/v1/event-types/{event_type.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(EventType.objects.filter(pk=event_type.id).exists())

    def test_cannot_access_other_users_event_type(self):
        other = make_user("bob")
        event_type = make_event_type(other)
        auth(self, self.user)
        response = self.client.get(f"/api/v1/event-types/{event_type.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class AvailabilityApiTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.event_type = make_event_type(self.user)
        auth(self, self.user)

    def test_create_rule(self):
        response = self.client.post(
            "/api/v1/availability/",
            {"event_type": self.event_type.id, "weekday": 1, "start_time": "09:00:00", "end_time": "17:00:00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AvailabilityRule.objects.count(), 1)

    def test_invalid_weekday_fails(self):
        response = self.client.post(
            "/api/v1/availability/",
            {"event_type": self.event_type.id, "weekday": 7, "start_time": "09:00:00", "end_time": "17:00:00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_end_before_start_fails(self):
        response = self.client.post(
            "/api/v1/availability/",
            {"event_type": self.event_type.id, "weekday": 1, "start_time": "17:00:00", "end_time": "09:00:00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rule_for_other_users_event_type_fails(self):
        other = make_user("bob")
        other_event_type = make_event_type(other)
        response = self.client.post(
            "/api/v1/availability/",
            {"event_type": other_event_type.id, "weekday": 1, "start_time": "09:00:00", "end_time": "17:00:00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_rules_only_own(self):
        other = make_user("bob")
        other_event_type = make_event_type(other)
        make_rule(self.event_type, 1)
        make_rule(other_event_type, 2)
        response = self.client.get("/api/v1/availability/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

class AvailabilityEngineTests(APITestCase):
    """Unit tests for the availability engine (Google busy periods injected)."""

    def setUp(self):
        self.user = make_user()
        self.event_type = make_event_type(self.user, duration=30)
        self.start_date = (dj_timezone.localdate() + timedelta(days=1))
        self.end_date = self.start_date + timedelta(days=6)

    def _weekday_of(self, days_ahead):
        return (dj_timezone.localdate() + timedelta(days=days_ahead)).weekday()

    def test_basic_slots(self):
        make_rule(self.event_type, self._weekday_of(1), "09:00", "17:00")
        slots = services.get_available_slots(self.event_type, self.start_date, self.end_date, busy_periods=[])
        self.assertTrue(slots)
        self.assertEqual(len(slots), 31)
        first = slots[0]
        self.assertEqual(first[0].minute, 0)
        self.assertEqual((first[1] - first[0]).total_seconds(), 1800)

    def test_busy_periods_removed(self):
        make_rule(self.event_type, self._weekday_of(1), "09:00", "17:00")
        day = self.start_date + timedelta(days=1)
        busy_start = datetime(day.year, day.month, day.day, 10, 0, tzinfo=timezone.utc)
        slots = services.get_available_slots(
            self.event_type, self.start_date, self.end_date,
            busy_periods=[(busy_start, busy_start + timedelta(minutes=30))],
        )
        self.assertFalse(any(start < busy_start + timedelta(minutes=30) and end > busy_start for start, end in slots))

    def test_buffers_applied(self):
        self.event_type.buffer_before = 15
        self.event_type.buffer_after = 15
        self.event_type.save()
        make_rule(self.event_type, self._weekday_of(1), "09:00", "10:00")
        slots = services.get_available_slots(self.event_type, self.start_date, self.end_date, busy_periods=[])
        self.assertEqual(len(slots), 1)
        self.assertEqual(slots[0][0].hour, 9)
        self.assertEqual(slots[0][0].minute, 15)

    def test_past_days_return_no_slots(self):
        make_rule(self.event_type, self._weekday_of(-2), "09:00", "17:00")
        past_start = dj_timezone.localdate() - timedelta(days=10)
        slots = services.get_available_slots(self.event_type, past_start, past_start, busy_periods=[])
        self.assertEqual(slots, [])

    def test_respects_host_timezone(self):
        self.user.timezone = "Asia/Kolkata"
        self.user.save()
        make_rule(self.event_type, self._weekday_of(1), "09:00", "10:00")
        slots = services.get_available_slots(self.event_type, self.start_date, self.end_date, busy_periods=[])
        self.assertTrue(slots)
        start = slots[0][0].astimezone(timezone.utc)
        self.assertEqual(start.hour, 3)  # 09:00 IST == 03:30 UTC -> slot starts 03:30

class BookingServiceTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.event_type = make_event_type(self.user, duration=30)
        self.tomorrow = dj_timezone.localdate() + timedelta(days=1)
        make_rule(self.event_type, self.tomorrow.weekday(), "00:00", "23:59")
        self.start = datetime(self.tomorrow.year, self.tomorrow.month, self.tomorrow.day, 10, 0, tzinfo=timezone.utc)
        self.end = self.start + timedelta(minutes=30)

    def _patch_google(self, create=None):
        patcher_busy = mock.patch.object(google_services, "get_busy_periods", return_value=[])
        patcher_create = mock.patch.object(
            google_services,
            "create_calendar_event",
            return_value=create
            or {"id": "evt123", "hangout_link": "https://meet.google.com/abc", "html_link": ""},
        )
        patcher_busy.start()
        patcher_create.start()
        self.addCleanup(patcher_busy.stop)
        self.addCleanup(patcher_create.stop)

    def test_successful_booking(self):
        self._patch_google()
        booking, error = services.create_booking(
            self.event_type, "Jane", "jane@example.com", self.start, self.end
        )
        self.assertIsNone(error)
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        self.assertEqual(booking.google_event_id, "evt123")
        self.assertEqual(booking.meet_link, "https://meet.google.com/abc")
        self.assertTrue(booking.cancellation_token)

    def test_double_booking_raises_conflict(self):
        self._patch_google()
        services.create_booking(self.event_type, "Jane", "jane@example.com", self.start, self.end)
        with self.assertRaises(services.BookingConflict):
            services.create_booking(self.event_type, "Bob", "bob@example.com", self.start, self.end)

    def test_unique_constraint_prevents_duplicate_slot(self):
        Booking.objects.create(
            event_type=self.event_type,
            invitee_name="Jane",
            invitee_email="jane@example.com",
            start_time=self.start,
            end_time=self.end,
            status=Booking.Status.CONFIRMED,
            cancellation_token=secrets.token_urlsafe(32),
        )
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Booking.objects.create(
                    event_type=self.event_type,
                    invitee_name="Bob",
                    invitee_email="bob@example.com",
                    start_time=self.start,
                    end_time=self.end,
                    status=Booking.Status.CONFIRMED,
                    cancellation_token=secrets.token_urlsafe(32),
                )

    def test_wrong_duration_fails(self):
        self._patch_google()
        with self.assertRaises(services.BookingValidationError):
            services.create_booking(
                self.event_type, "Jane", "jane@example.com", self.start, self.start + timedelta(minutes=60)
            )

    def test_google_event_creation_failure_marks_failed(self):
        self._patch_google(create=None)
        mock.patch.object(
            google_services,
            "create_calendar_event",
            side_effect=google_services.GoogleApiError("boom"),
        ).start()
        booking, error = services.create_booking(
            self.event_type, "Jane", "jane@example.com", self.start, self.end
        )
        self.assertTrue(error)
        self.assertEqual(booking.status, Booking.Status.FAILED)

    def test_google_free_busy_failure_raises(self):
        mock.patch.object(
            google_services,
            "get_busy_periods",
            side_effect=google_services.GoogleApiError("boom"),
        ).start()
        with self.assertRaises(services.BookingGoogleError):
            services.create_booking(
                self.event_type, "Jane", "jane@example.com", self.start, self.end
            )

class CancellationTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.event_type = make_event_type(self.user)
        self.booking = Booking.objects.create(
            event_type=self.event_type,
            invitee_name="Jane",
            invitee_email="jane@example.com",
            start_time=dj_timezone.now() + timedelta(days=1),
            end_time=dj_timezone.now() + timedelta(days=1, minutes=30),
            status=Booking.Status.CONFIRMED,
            google_event_id="evt123",
            cancellation_token=secrets.token_urlsafe(32),
        )

    def test_invitee_cancel_with_token(self):
        with mock.patch.object(google_services, "delete_calendar_event", return_value=True) as delete:
            response = self.client.post(
                reverse("meetings:booking-cancel", args=[self.booking.id]),
                {"token": self.booking.cancellation_token},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.CANCELLED)
        delete.assert_called_once()

    def test_invalid_token_fails(self):
        response = self.client.post(
            reverse("meetings:booking-cancel", args=[self.booking.id]),
            {"token": "wrong-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.CONFIRMED)

    def test_host_cancel(self):
        self.client.force_authenticate(user=self.user)
        with mock.patch.object(google_services, "delete_calendar_event", return_value=True):
            response = self.client.post(
                reverse("meetings:booking-cancel", args=[self.booking.id]),
                {},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.CANCELLED)

class ReminderTests(APITestCase):
    def test_claim_due_reminders_only_once(self):
        user = make_user()
        event_type = make_event_type(user)
        booking = Booking.objects.create(
            event_type=event_type,
            invitee_name="Jane",
            invitee_email="jane@example.com",
            start_time=dj_timezone.now() + timedelta(hours=3),
            end_time=dj_timezone.now() + timedelta(hours=3, minutes=30),
            status=Booking.Status.CONFIRMED,
            cancellation_token=secrets.token_urlsafe(32),
        )
        due = services.claim_due_reminders(user, window_hours=24)
        self.assertEqual(len(due), 1)
        booking.refresh_from_db()
        self.assertTrue(booking.reminder_sent)

        due_again = services.claim_due_reminders(user, window_hours=24)
        self.assertEqual(due_again, [])

class RateLimitTests(APITestCase):
    def test_public_endpoint_rate_limited(self):
        user = make_user()
        make_event_type(user)
        url = reverse("meetings:public-event-type", args=["alice", "intro"])

        with mock.patch.object(PublicRateThrottle, "THROTTLE_RATES", {"public": "3/min"}):
            for _ in range(3):
                self.assertNotEqual(
                    self.client.get(url).status_code, status.HTTP_429_TOO_MANY_REQUESTS
                )
            response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)