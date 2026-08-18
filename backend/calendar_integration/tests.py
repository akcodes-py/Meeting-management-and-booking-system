"""Tests for Google OAuth state handling, token refresh and revoked auth."""

from datetime import timedelta
from unittest import mock

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User

from . import services
from .models import CalendarConnection


class FakeResponse:
    def __init__(self, ok=True, status_code=200, data=None):
        self.ok = ok
        self.status_code = status_code
        self._data = data or {}

    def json(self):
        return self._data


def make_user():
    return User.objects.create_user(
        email="host@example.com", password="pass12345", name="Host", username="host"
    )


class OAuthStateTests(APITestCase):
    @override_settings(GOOGLE_OAUTH_CLIENT_ID="client-id")
    def test_build_and_validate_state(self):
        user = make_user()
        url, state = services.build_authorization_url(user)
        self.assertIn("client_id=client-id", url)
        self.assertEqual(services.validate_state(state), user.id)

    def test_tampered_state_rejected(self):
        user = make_user()
        self.assertEqual(services.validate_state("garbage"), None)
        self.assertEqual(services.validate_state(""), None)

        state = services._SIGNER.sign(str(user.id))
        self.assertEqual(services.validate_state(state + "x"), None)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="")
    def test_missing_client_id_raises(self):
        user = make_user()
        with self.assertRaises(services.GoogleAuthError):
            services.build_authorization_url(user)


class TokenRefreshTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.connection = CalendarConnection.objects.create(
            user=self.user,
            access_token="old-token",
            refresh_token="refresh-token",
            token_expiry=timezone.now() - timedelta(minutes=1),
        )

    @mock.patch(
        "requests.post",
        return_value=FakeResponse(True, 200, {"access_token": "new-token", "expires_in": 3600}),
    )
    def test_expired_token_is_refreshed(self, mock_post):
        token = services.get_access_token(self.user)
        self.assertEqual(token, "new-token")
        self.connection.refresh_from_db()
        self.assertEqual(self.connection.access_token, "new-token")
        self.assertFalse(self.connection.needs_reauth)

    @mock.patch(
        "requests.post",
        return_value=FakeResponse(False, 400, {"error": "invalid_grant"}),
    )
    def test_revoked_authorization_raises_and_flags_reauth(self, mock_post):
        with self.assertRaises(services.GoogleRevokedError):
            services.get_access_token(self.user)
        self.connection.refresh_from_db()
        self.assertTrue(self.connection.needs_reauth)

    @mock.patch(
        "requests.post",
        return_value=FakeResponse(True, 200, {"access_token": "unused", "expires_in": 3600}),
    )
    def test_fresh_token_not_refreshed(self, mock_post):
        self.connection.token_expiry = timezone.now() + timedelta(hours=1)
        self.connection.save()
        token = services.get_access_token(self.user)
        self.assertEqual(token, "old-token")
        mock_post.assert_not_called()


class CalendarApiTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        CalendarConnection.objects.create(
            user=self.user,
            access_token="access-token",
            refresh_token="refresh-token",
            token_expiry=timezone.now() + timedelta(hours=1),
        )

    @mock.patch(
        "calendar_integration.services._call_api",
        return_value=FakeResponse(True, 200, {
            "calendars": {"primary": {"busy": [{"start": "2026-08-17T10:00:00Z", "end": "2026-08-17T10:30:00Z"}]}}
        }),
    )
    def test_get_busy_periods_parses_utc(self, mock_call):
        from datetime import datetime, timezone as tz

        start = datetime(2026, 8, 17, 0, 0, tzinfo=tz.utc)
        end = datetime(2026, 8, 18, 0, 0, tzinfo=tz.utc)
        busy = services.get_busy_periods(self.user, start, end)
        self.assertEqual(len(busy), 1)
        self.assertEqual(busy[0][0].hour, 10)

    @mock.patch(
        "calendar_integration.services._call_api",
        return_value=FakeResponse(True, 200, {
            "id": "event-1",
            "hangoutLink": "https://meet.google.com/abc",
            "htmlLink": "https://calendar.google.com/event?eid=1",
        }),
    )
    def test_create_calendar_event_returns_meet_link(self, mock_call):
        from datetime import datetime, timezone as tz
        from types import SimpleNamespace

        event_type = SimpleNamespace(title="Intro Call")
        event = services.create_calendar_event(
            self.user,
            event_type,
            datetime(2026, 8, 17, 10, 0, tzinfo=tz.utc),
            datetime(2026, 8, 17, 10, 30, tzinfo=tz.utc),
            "Jane",
            "jane@example.com",
        )
        self.assertEqual(event["id"], "event-1")
        self.assertEqual(event["hangout_link"], "https://meet.google.com/abc")