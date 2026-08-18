"""Tests for authentication: signup, login, invalid auth, protected endpoints."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthTests(APITestCase):
    def test_signup_returns_tokens_and_creates_user(self):
        response = self.client.post(
            reverse("accounts:signup"),
            {"email": "host@example.com", "name": "Host", "password": "strongpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "host@example.com")
        self.assertEqual(User.objects.count(), 1)

    def test_signup_duplicate_email_fails(self):
        User.objects.create_user(email="host@example.com", password="strongpass123")
        response = self.client.post(
            reverse("accounts:signup"),
            {"email": "HOST@example.com", "name": "Host", "password": "strongpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_invalid_timezone_fails(self):
        response = self.client.post(
            reverse("accounts:signup"),
            {"email": "host@example.com", "name": "Host", "password": "strongpass123", "timezone": "Not/AZone"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens(self):
        User.objects.create_user(email="host@example.com", password="strongpass123", name="Host")
        response = self.client.post(
            reverse("accounts:login"),
            {"email": "host@example.com", "password": "strongpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_login_invalid_credentials_fails(self):
        User.objects.create_user(email="host@example.com", password="strongpass123")
        response = self.client.post(
            reverse("accounts:login"),
            {"email": "host@example.com", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_protected_endpoint_without_token_returns_401(self):
        response = self.client.get("/api/v1/event-types/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-valid-token")
        response = self.client.get("/api/v1/event-types/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_token_works(self):
        user = User.objects.create_user(email="host@example.com", password="strongpass123", name="Host")
        login = self.client.post(
            reverse("accounts:login"),
            {"email": "host@example.com", "password": "strongpass123"},
            format="json",
        )
        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/event-types/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(user.pk)