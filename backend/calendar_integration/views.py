"""
Google Calendar OAuth endpoints.

    GET  /api/v1/calendar/connect/    -> start OAuth flow (returns auth URL + state)
    GET  /api/v1/calendar/callback/   -> OAuth redirect target, exchanges code
    GET  /api/v1/calendar/status/     -> connection + re-auth status
    POST /api/v1/calendar/disconnect/ -> remove the connection

The callback is reached via a browser redirect, so it authenticates the host
using the *signed state value* (which embeds the user id) rather than a JWT
header. The authorization URL is only issued to an authenticated host.

If ``FRONTEND_URL`` is configured, the callback redirects the browser back to
the frontend instead of returning JSON.
"""

from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiTypes, extend_schema

from . import services


@extend_schema(
    tags=["Calendar"],
    responses={200: OpenApiTypes.OBJECT, 503: OpenApiTypes.OBJECT},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def connect(request):
    """Start the Google OAuth flow for the authenticated host."""
    try:
        url, state = services.build_authorization_url(request.user)
    except services.GoogleAuthError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({"authorization_url": url, "state": state})


def _frontend_redirect(params):
    """Redirect to the frontend if configured, otherwise return None."""
    if not settings.FRONTEND_URL:
        return None
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return HttpResponseRedirect(f"{settings.FRONTEND_URL}/settings?{query}")


@extend_schema(tags=["Calendar"], responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
def callback(request):
    """OAuth callback: validate state, exchange code, store connection."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code or not state:
        redirect = _frontend_redirect({"calendar": "error", "message": "missing-params"})
        if redirect:
            return redirect
        return Response(
            {"detail": "Missing authorization code or state."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_id = services.validate_state(state)
    if user_id is None:
        redirect = _frontend_redirect({"calendar": "error", "message": "invalid-state"})
        if redirect:
            return redirect
        return Response(
            {"detail": "Invalid or expired OAuth state."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        connection = services.save_connection_for_user(user_id, code)
    except services.GoogleAuthError as exc:
        redirect = _frontend_redirect({"calendar": "error", "message": "exchange-failed"})
        if redirect:
            return redirect
        return Response(
            {"detail": f"OAuth handshake failed: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    redirect = _frontend_redirect({"calendar": "connected"})
    if redirect:
        return redirect

    return Response(
        {
            "detail": "Google Calendar connected.",
            "google_account_email": connection.google_account_email,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(tags=["Calendar"], responses={200: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status(request):
    """Return the connection / re-authentication status for the host."""
    try:
        connection = services.get_connection(request.user)
    except services.NoCalendarConnectionError:
        return Response(
            {
                "connected": False,
                "needs_reauth": False,
                "provider": None,
                "google_account_email": None,
            }
        )

    return Response(
        {
            "connected": True,
            "needs_reauth": connection.needs_reauth,
            "provider": connection.provider,
            "google_account_email": connection.google_account_email,
            "token_expiry": connection.token_expiry,
        }
    )


@extend_schema(tags=["Calendar"], responses={200: OpenApiTypes.OBJECT})
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def disconnect(request):
    """Remove the host's calendar connection and its stored tokens."""
    services.disconnect(request.user)
    return Response({"detail": "Google Calendar disconnected."})