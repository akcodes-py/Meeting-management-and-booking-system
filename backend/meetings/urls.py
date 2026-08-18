"""Meetings app URL configuration."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("event-types", views.EventTypeViewSet, basename="event-type")
router.register("availability", views.AvailabilityRuleViewSet, basename="availability")

app_name = "meetings"

urlpatterns = [
    path("", views.meetings_root, name="meetings-root"),
    path("bookings/", views.bookings_list, name="bookings-list"),
    path("bookings/upcoming/", views.upcoming_bookings, name="bookings-upcoming"),
    path("bookings/reminders-due/", views.reminders_due, name="bookings-reminders-due"),
    path("bookings/<int:pk>/cancel/", views.booking_cancel, name="booking-cancel"),
    path("public/<slug:username>/<slug:slug>/", views.public_event_type, name="public-event-type"),
    path("public/<slug:username>/<slug:slug>/availability/", views.public_availability, name="public-availability"),
    path("public/<slug:username>/<slug:slug>/book/", views.public_booking, name="public-booking"),
]

urlpatterns += router.urls