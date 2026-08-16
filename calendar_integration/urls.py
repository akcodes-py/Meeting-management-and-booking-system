"""
Calendar Integration app URL configuration.

Routes:
    /api/v1/calendar/   - Calendar root (health check placeholder)
"""

from django.urls import path
from . import views

app_name = 'calendar_integration'

urlpatterns = [
    path('', views.calendar_root, name='calendar-root'),
]
