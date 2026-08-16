"""
Meetings app URL configuration.

Routes:
    /api/v1/meetings/   - Meetings root (health check placeholder)
"""

from django.urls import path
from . import views

app_name = 'meetings'

urlpatterns = [
    path('', views.meetings_root, name='meetings-root'),
]
