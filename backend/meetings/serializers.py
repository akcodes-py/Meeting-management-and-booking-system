"""Serializers for the meetings app."""

from rest_framework import serializers

from .models import AvailabilityRule, Booking, EventType


class EventTypeSerializer(serializers.ModelSerializer):
    """Serializer for EventType CRUD (host-facing)."""

    class Meta:
        model = EventType
        fields = [
            "id",
            "slug",
            "title",
            "duration",
            "buffer_before",
            "buffer_after",
            "location",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_slug(self, value):
        user = self.context["request"].user
        queryset = EventType.objects.filter(user=user, slug=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("You already have an event type with this slug.")
        return value

    def validate_duration(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be a positive number of minutes.")
        return value


class AvailabilityRuleSerializer(serializers.ModelSerializer):
    """Serializer for AvailabilityRule CRUD (host-facing)."""

    class Meta:
        model = AvailabilityRule
        fields = ["id", "event_type", "weekday", "start_time", "end_time", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_event_type(self, value):
        user = self.context["request"].user
        if value.user_id != user.id:
            raise serializers.ValidationError("You can only add rules to your own event types.")
        return value

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError("end_time must be later than start_time.")
        return attrs


class BookingSerializer(serializers.ModelSerializer):
    """Response serializer for bookings (includes cancellation token and Meet link)."""

    event_type = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "event_type",
            "invitee_name",
            "invitee_email",
            "start_time",
            "end_time",
            "google_event_id",
            "meet_link",
            "status",
            "cancellation_token",
            "created_at",
        ]
        read_only_fields = fields


class PublicBookingSerializer(serializers.Serializer):
    """Input serializer for the public booking endpoint (no auth)."""

    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()