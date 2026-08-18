"""API views for the meetings app."""

from datetime import datetime, timedelta

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiTypes, extend_schema

from accounts.models import User
from calendar_integration import services as google_services

from . import email_service, services
from .models import AvailabilityRule, Booking, EventType
from .serializers import (
    AvailabilityRuleSerializer,
    BookingSerializer,
    EventTypeSerializer,
    PublicBookingSerializer,
)
from .throttles import PublicBookingRateThrottle, PublicRateThrottle

@extend_schema(tags=["Health"], responses={200: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
def meetings_root(request):
    """Health-check endpoint for the meetings app."""
    return Response({"app": "meetings", "status": "ok"})

class EventTypeViewSet(viewsets.ModelViewSet):
    """Authenticated CRUD for the host's own event types."""

    serializer_class = EventTypeSerializer

    def get_queryset(self):
        return EventType.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AvailabilityRuleViewSet(viewsets.ModelViewSet):
    """Authenticated CRUD for the host's availability rules."""

    serializer_class = AvailabilityRuleSerializer

    def get_queryset(self):
        return AvailabilityRule.objects.filter(event_type__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()

def _get_public_event_type(username, slug):
    host = get_object_or_404(User, username=username)
    return get_object_or_404(EventType, user=host, slug=slug, active=True)

def _parse_date(value, default):
    if not value:
        return default
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None

@extend_schema(tags=["Public"], responses={200: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([PublicRateThrottle])
def public_event_type(request, username, slug):
    """Public details for a booking page."""
    event_type = _get_public_event_type(username, slug)
    return Response(
        {
            "id": event_type.id,
            "slug": event_type.slug,
            "title": event_type.title,
            "duration": event_type.duration,
            "buffer_before": event_type.buffer_before,
            "buffer_after": event_type.buffer_after,
            "location": event_type.location,
            "host_name": event_type.user.name,
            "username": event_type.user.username,
            "timezone": event_type.user.timezone,
        }
    )

@extend_schema(tags=["Public"], responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 502: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([PublicRateThrottle])
def public_availability(request, username, slug):
    """Available slots for a date range."""
    event_type = _get_public_event_type(username, slug)

    today = timezone.localdate()
    default_end = today + timedelta(days=settings.PUBLIC_AVAILABILITY_DAYS)
    start = _parse_date(request.query_params.get("start_date"), today)
    end = _parse_date(request.query_params.get("end_date"), default_end)

    if start is None or end is None:
        return Response(
            {"detail": "Dates must use YYYY-MM-DD format."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if end < start:
        return Response(
            {"detail": "end_date must be on or after start_date."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if (end - start).days > 60:
        return Response(
            {"detail": "Date range cannot exceed 60 days."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        slots = services.get_available_slots(event_type, start, end)
    except google_services.GoogleAuthError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(
            {
                "slug": event_type.slug,
                "timezone": event_type.user.timezone,
                "slots": [
                    {"start": slot_start.isoformat(), "end": slot_end.isoformat()}
                    for slot_start, slot_end in slots
                ],
            }
        )

@extend_schema(
    tags=["Public"],
    request=PublicBookingSerializer,
    responses={
        201: BookingSerializer,
        400: OpenApiTypes.OBJECT,
        409: OpenApiTypes.OBJECT,
        502: OpenApiTypes.OBJECT,
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicBookingRateThrottle])
def public_booking(request, username, slug):
    """Create a booking as an invitee."""
    event_type = _get_public_event_type(username, slug)

    serializer = PublicBookingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        booking, google_error = services.create_booking(
            event_type,
            data["name"],
            data["email"],
            data["start_time"],
            data["end_time"],
        )
    except services.BookingValidationError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except services.BookingConflict as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
    except services.BookingGoogleError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    if google_error:
        return Response(
            {"detail": google_error},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    email_service.send_booking_confirmation(booking)
    return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

@extend_schema(
    tags=["Bookings"],
    request=OpenApiTypes.OBJECT,
    responses={200: BookingSerializer, 403: OpenApiTypes.OBJECT},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def booking_cancel(request, pk):
    """Cancel a booking as the host (JWT) or the invitee (token)."""
    booking = get_object_or_404(Booking, pk=pk)
    token = request.data.get("token")
    user = request.user if request.user.is_authenticated else None

    try:
        services.cancel_booking(booking, user=user, token=token)
    except services.BookingPermissionDenied as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

    email_service.send_booking_cancellation(booking)
    return Response(BookingSerializer(booking).data)

@extend_schema(tags=["Bookings"], responses={200: BookingSerializer(many=True)})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bookings_list(request):
    """List the host's bookings."""
    bookings = Booking.objects.filter(event_type__user=request.user).order_by("-start_time")
    return Response(BookingSerializer(bookings, many=True).data)

@extend_schema(tags=["Bookings"], responses={200: BookingSerializer(many=True)})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def upcoming_bookings(request):
    """Upcoming confirmed bookings for the host's dashboard."""
    bookings = Booking.objects.filter(
        event_type__user=request.user,
        status=Booking.Status.CONFIRMED,
        start_time__gte=timezone.now(),
    ).order_by("start_time")
    return Response(BookingSerializer(bookings, many=True).data)

@extend_schema(tags=["Bookings"], responses={200: BookingSerializer(many=True)})
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reminders_due(request):
    """Claim and return bookings that need a reminder (used by n8n)."""
    bookings = services.claim_due_reminders(request.user)
    return Response({"bookings": BookingSerializer(bookings, many=True).data})