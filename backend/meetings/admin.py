"""Admin configuration for the meetings app."""

from django.contrib import admin

from .models import AvailabilityRule, Booking, EventType


@admin.register(EventType)
class EventTypeAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "user", "duration", "active", "created_at"]
    search_fields = ["title", "slug", "user__email"]


@admin.register(AvailabilityRule)
class AvailabilityRuleAdmin(admin.ModelAdmin):
    list_display = ["event_type", "weekday", "start_time", "end_time"]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["invitee_email", "event_type", "start_time", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["invitee_email", "invitee_name"]