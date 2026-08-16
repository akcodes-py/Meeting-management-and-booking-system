"""
URL configuration for the Meeting Management & Booking System.

API structure:
    /api/v1/accounts/           - Authentication & user management
    /api/v1/calendar/           - Calendar integration endpoints
    /api/v1/meetings/           - Meeting & booking endpoints
    /api/v1/auth/token/         - JWT token obtain
    /api/v1/auth/token/refresh/ - JWT token refresh
    /api/v1/auth/token/verify/  - JWT token verify
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # JWT Authentication endpoints
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # App-level API routes
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/calendar/', include('calendar_integration.urls')),
    path('api/v1/meetings/', include('meetings.urls')),
]
