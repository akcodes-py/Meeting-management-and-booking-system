"""Throttle classes used by the public booking endpoints."""

from rest_framework.throttling import SimpleRateThrottle


class PublicRateThrottle(SimpleRateThrottle):
    """Rate limit for read-only public endpoints (booking page, availability)."""

    scope = "public"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class PublicBookingRateThrottle(SimpleRateThrottle):
    """Stricter rate limit for the public booking endpoint."""

    scope = "public_booking"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}