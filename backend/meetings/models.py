"""
Core models for the Meeting Management & Booking System.

    EventType        - what a host offers (title, duration, buffers, ...)
    AvailabilityRule - recurring weekly windows during which an event type
                       can be booked
    Booking          - a concrete booking made by an invitee
"""

from django.conf import settings
from django.db import models

class EventType(models.Model):
    """A schedulable meeting type owned by a host user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_types",
    )
    slug = models.SlugField(
        max_length=64,
        help_text="Public slug used in booking links, e.g. /public/<user>/<slug>/.",
    )
    title = models.CharField(max_length=200)
    duration = models.PositiveIntegerField(help_text="Meeting length in minutes.")
    buffer_before = models.PositiveIntegerField(default=0, help_text="Minutes kept free before a meeting.")
    buffer_after = models.PositiveIntegerField(default=0, help_text="Minutes kept free after a meeting.")
    location = models.CharField(max_length=255, blank=True, default="")
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "slug"], name="uniq_event_type_slug_per_user"),
            models.CheckConstraint(check=models.Q(duration__gt=0), name="event_type_duration_positive"),
            models.CheckConstraint(check=models.Q(buffer_before__gte=0), name="event_type_buffer_before_non_negative"),
            models.CheckConstraint(check=models.Q(buffer_after__gte=0), name="event_type_buffer_after_non_negative"),
        ]

    def __str__(self):
        return f"{self.title} ({self.slug})"

class AvailabilityRule(models.Model):
    """A recurring weekly availability window for an event type."""

    WEEKDAYS = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    event_type = models.ForeignKey(
        EventType,
        on_delete=models.CASCADE,
        related_name="availability_rules",
    )
    weekday = models.PositiveSmallIntegerField(choices=WEEKDAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["weekday", "start_time"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(weekday__gte=0, weekday__lte=6),
                name="availability_weekday_in_range",
            ),
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F("start_time")),
                name="availability_end_after_start",
            ),
        ]

    def __str__(self):
        return f"{self.event_type_id} / {self.get_weekday_display()} {self.start_time}-{self.end_time}"

class Booking(models.Model):
    """A concrete booking of an event type by an invitee."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CANCELLED = "CANCELLED", "Cancelled"
        FAILED = "FAILED", "Failed"

    event_type = models.ForeignKey(
        EventType,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    invitee_name = models.CharField(max_length=255)
    invitee_email = models.EmailField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    google_event_id = models.CharField(max_length=255, blank=True, default="")
    meet_link = models.URLField(blank=True, default="")

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # Sent to the invitee in the confirmation email; needed to cancel.
    cancellation_token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        blank=True,
        default="",
    )

    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]
        constraints = [
            models.UniqueConstraint(fields=["event_type", "start_time"], name="uniq_booking_slot"),
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F("start_time")),
                name="booking_end_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["event_type", "start_time"]),
            models.Index(fields=["status", "start_time"]),
        ]

    def __str__(self):
        return f"{self.invitee_email} / {self.event_type_id} / {self.status}"