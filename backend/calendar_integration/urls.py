"""
Calendar Integration app URL configuration.

Routes:
    /api/v1/calendar/connect/     - Start Google OAuth flow
    /api/v1/calendar/callback/    - OAuth redirect target
    /api/v1/calendar/status/      - Connection status
    /api/v1/calendar/disconnect/  - Remove connection
"""

from django.urls import path

from . import views

app_name = "calendar_integration"

urlpatterns = [
    path("connect/", views.connect, name="calendar-connect"),
    path("callback/", views.callback, name="calendar-callback"),
    path("status/", views.status, name="calendar-status"),
    path("disconnect/", views.disconnect, name="calendar-disconnect"),
]