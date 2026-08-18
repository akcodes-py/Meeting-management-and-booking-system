"""
Calendar integration models.

``CalendarConnection`` stores a user's Google OAuth credentials so the backend
can read free/busy data and create calendar events on their behalf.

Credentials are stored in the database and are never written to logs.
"""

from django.conf import settings
from django.db import models

class CalendarConnection(models.Model):
    """OAuth credentials linking a host user to their Google Calendar."""

    provider = models.CharField(max_length=32, default=settings.GOOGLE_OAUTH_PROVIDER)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calendar_connection",
    )

    google_account_email = models.EmailField(blank=True, default="")

    access_token = models.TextField(blank=True, default="")
    refresh_token = models.TextField(blank=True, default="")
    token_expiry = models.DateTimeField(null=True, blank=True)

    # True when Google reports the refresh token as revoked/invalid.
    needs_reauth = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "calendar connection"
        verbose_name_plural = "calendar connections"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["provider"]),
        ]

    def __str__(self):
        return f"{self.user_id} / {self.provider} / {self.google_account_email or '-'}"