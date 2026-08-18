"""Admin configuration for the calendar integration app."""

from django.contrib import admin

from .models import CalendarConnection


@admin.register(CalendarConnection)
class CalendarConnectionAdmin(admin.ModelAdmin):
    list_display = ["user", "provider", "google_account_email", "needs_reauth", "token_expiry", "created_at"]
    readonly_fields = ["access_token", "refresh_token"]