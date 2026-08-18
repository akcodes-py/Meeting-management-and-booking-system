"""
Google OAuth 2.0 + Google Calendar API client.

Responsibilities:
    * build and validate signed OAuth ``state`` values (Django signing)
    * exchange authorization codes for access/refresh tokens
    * refresh expired access tokens
    * detect revoked authorization and flag the connection for re-auth
    * query free/busy periods
    * create calendar events with a Google Meet conference
    * delete calendar events during cancellation

Tokens are used only inside this module and are never logged.
"""

import uuid
from datetime import datetime, timedelta, timezone

import requests
from django.conf import settings
from django.core.signing import BadSignature, TimestampSigner
from django.utils import timezone as dj_timezone

from .models import CalendarConnection

class GoogleAuthError(Exception):
    """Base error for Google OAuth / Calendar problems."""

class NoCalendarConnectionError(GoogleAuthError):
    """The host has not connected their Google Calendar."""

class GoogleRevokedError(GoogleAuthError):
    """The refresh token has been revoked / authorization invalidated."""

class GoogleApiError(GoogleAuthError):
    """A Google Calendar API call failed."""

_SIGNER = TimestampSigner(salt="google-oauth-state")

def build_authorization_url(user):
    """Return (authorization_url, signed_state) for a host user."""
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        raise GoogleAuthError("GOOGLE_OAUTH_CLIENT_ID is not configured.")

    state = _SIGNER.sign(str(user.id))
    params = {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": settings.GOOGLE_OAUTH_SCOPE,
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    request = requests.Request("GET", settings.GOOGLE_OAUTH_AUTH_URI, params=params)
    return request.prepare().url, state

def validate_state(state):
    """
    Validate a signed OAuth state.

    Returns the ``user_id`` on success, ``None`` on any failure
    (expired, tampered or malformed).
    """
    if not state:
        return None
    try:
        value = _SIGNER.unsign(state, max_age=settings.GOOGLE_OAUTH_STATE_TTL_SECONDS)
    except BadSignature:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def exchange_code_for_tokens(code):
    """Exchange an authorization code for access/refresh tokens."""
    data = {
        "code": code,
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post(settings.GOOGLE_OAUTH_TOKEN_URI, data=data, timeout=30)
    if not response.ok:
        raise GoogleAuthError(f"Token exchange failed (HTTP {response.status_code}).")
    payload = response.json()
    return {
        "access_token": payload.get("access_token"),
        "refresh_token": payload.get("refresh_token"),
        "expires_in": payload.get("expires_in"),
    }

def save_connection_for_user(user_id, code):
    """Exchange the code and store the resulting connection for a user."""
    tokens = exchange_code_for_tokens(code)
    connection, _ = CalendarConnection.objects.get_or_create(user_id=user_id)
    connection.access_token = tokens["access_token"]
    if tokens.get("refresh_token"):
        connection.refresh_token = tokens["refresh_token"]
    if tokens.get("expires_in"):
        connection.token_expiry = dj_timezone.now() + timedelta(seconds=tokens["expires_in"])
    connection.needs_reauth = False
    connection.save()
    return connection

def get_connection(user):
    """Return the user's calendar connection or raise NoCalendarConnectionError."""
    try:
        return CalendarConnection.objects.get(user=user)
    except CalendarConnection.DoesNotExist as exc:
        raise NoCalendarConnectionError("No Google Calendar connected.") from exc

def refresh_access_token(connection):
    """Refresh the access token using the stored refresh token."""
    if not connection.refresh_token:
        connection.needs_reauth = True
        connection.save(update_fields=["needs_reauth"])
        raise GoogleRevokedError("No refresh token available; re-authentication required.")

    data = {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
        "refresh_token": connection.refresh_token,
        "grant_type": "refresh_token",
    }
    response = requests.post(settings.GOOGLE_OAUTH_TOKEN_URI, data=data, timeout=30)

    if response.status_code == 400 and response.json().get("error") == "invalid_grant":
        connection.needs_reauth = True
        connection.save(update_fields=["needs_reauth"])
        raise GoogleRevokedError("Google authorization has been revoked; please reconnect.")

    if not response.ok:
        raise GoogleApiError(f"Token refresh failed (HTTP {response.status_code}).")

    payload = response.json()
    connection.access_token = payload["access_token"]
    if payload.get("expires_in"):
        connection.token_expiry = dj_timezone.now() + timedelta(seconds=payload["expires_in"])
    connection.needs_reauth = False
    connection.save()
    return connection.access_token

def get_access_token(user):
    """
    Return a valid access token, refreshing it when it is missing or close to
    expiry. Raises ``NoCalendarConnectionError`` if the user never connected
    and ``GoogleRevokedError`` if the refresh token was revoked.
    """
    connection = get_connection(user)
    margin = timedelta(seconds=settings.GOOGLE_TOKEN_REFRESH_MARGIN_SECONDS)
    needs_refresh = (
        not connection.access_token
        or connection.token_expiry is None
        or connection.token_expiry - dj_timezone.now() < margin
    )
    if needs_refresh:
        return refresh_access_token(connection)
    return connection.access_token

def _parse_datetime(value):
    """Parse an ISO-8601 string into an aware UTC datetime."""
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)

def _call_api(method, url, user, **kwargs):
    """Perform a calendar request, refreshing the token once on 401/403."""
    access_token = get_access_token(user)
    headers = {"Authorization": f"Bearer {access_token}"}
    response = method(url, headers=headers, timeout=30, **kwargs)
    if response.status_code in (401, 403):
        access_token = refresh_access_token(get_connection(user))
        headers["Authorization"] = f"Bearer {access_token}"
        response = method(url, headers=headers, timeout=30, **kwargs)
    return response

def get_busy_periods(user, time_min, time_max):
    """
    Query the user's primary calendar for busy periods in [time_min, time_max].

    Both bounds must be aware datetimes. Returns a list of ``(start, end)``
    aware UTC datetime pairs.
    """
    body = {
        "timeMin": time_min.isoformat(),
        "timeMax": time_max.isoformat(),
        "timeZone": user.timezone,
        "items": [{"id": "primary"}],
    }
    url = f"{settings.GOOGLE_CALENDAR_API_BASE}/freeBusy"
    response = _call_api(requests.post, url, user, json=body)

    if not response.ok:
        raise GoogleApiError(f"Free/busy query failed (HTTP {response.status_code}).")

    payload = response.json()
    busy = payload.get("calendars", {}).get("primary", {}).get("busy", [])
    return [(_parse_datetime(item["start"]), _parse_datetime(item["end"])) for item in busy]

def create_calendar_event(user, event_type, start, end, invitee_name, invitee_email):
    """
    Create a Google Calendar event with a Google Meet conference.

    Returns a dict with ``id``, ``hangout_link`` and ``html_link``.
    """
    event = {
        "summary": f"{event_type.title} with {invitee_name}",
        "description": f"Meeting booked through {event_type.title}.",
        "start": {"dateTime": start.isoformat(), "timeZone": user.timezone},
        "end": {"dateTime": end.isoformat(), "timeZone": user.timezone},
        "attendees": [{"email": invitee_email, "displayName": invitee_name}],
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }
    url = f"{settings.GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?conferenceDataVersion=1"
    response = _call_api(requests.post, url, user, json=event)

    if not response.ok:
        raise GoogleApiError(f"Event creation failed (HTTP {response.status_code}).")

    payload = response.json()
    return {
        "id": payload.get("id"),
        "hangout_link": payload.get("hangoutLink"),
        "html_link": payload.get("htmlLink"),
    }

def delete_calendar_event(user, google_event_id):
    """
    Delete a calendar event. Best-effort: 404 is treated as success.
    Returns ``True`` if the event is gone, ``False`` otherwise.
    """
    if not google_event_id:
        return False
    url = f"{settings.GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{google_event_id}"
    try:
        response = _call_api(requests.delete, url, user)
    except GoogleAuthError:
        return False
    return response.status_code in (200, 204, 404)

def disconnect(user):
    """Remove the user's calendar connection (tokens are dropped)."""
    CalendarConnection.objects.filter(user=user).delete()