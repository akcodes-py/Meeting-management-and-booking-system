"""
URL configuration for the Meeting Management & Booking System.

API structure:
    /api/health/                       - Public health check (no auth)
    /api/v1/health/                    - Public health check (no auth)
    /api/v1/auth/...                   - signup, login, JWT token endpoints
    /api/v1/calendar/...               - Google OAuth endpoints
    /api/v1/event-types/...            - Event type CRUD (host-only)
    /api/v1/availability/...           - Availability rule CRUD (host-only)
    /api/v1/bookings/...               - Booking list, cancellation, reminders
    /api/v1/public/<username>/<slug>   - Public booking flow (no auth)
    /api/v1/schema/...                 - OpenAPI / Swagger / ReDoc
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


def health_check(request):
    """Simple unauthenticated health check endpoint for Railway / load balancers."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    # Health checks
    path("api/health/", health_check, name="api-health"),
    path("api/v1/health/", health_check, name="api-v1-health"),
    path("health/", health_check, name="health"),

    path("admin/", admin.site.urls),

    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),

    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/calendar/", include("calendar_integration.urls")),
    path("api/v1/", include("meetings.urls")),

    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/v1/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]