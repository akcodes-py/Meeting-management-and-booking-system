"""
Custom User model for the Meeting Management & Booking System.

Uses email as the unique login identifier instead of username.
Passwords are handled by Django's built-in hashing mechanism via AbstractBaseUser.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.text import slugify

class UserManager(BaseUserManager):
    """
    Custom manager for the User model.

    Provides helper methods to create regular users and superusers
    using email as the unique identifier.
    """

    def _generate_username(self, email):
        """Create a unique public slug from the email address local part."""
        base = slugify(email.split('@')[0]) or 'user'
        username = base
        counter = 1
        while self.model.objects.filter(username=username).exists():
            counter += 1
            username = f"{base}-{counter}"
        return username

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with the given email and password."""
        if not email:
            raise ValueError("The Email field must be set.")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("username", self._generate_username(email))
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with the given email and password."""
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for the Meeting Management & Booking System.

    Uses email as the unique identifier for authentication instead of
    the default Django username field.
    """

    email = models.EmailField(
        "email address",
        unique=True,
        db_index=True,
    )
    username = models.SlugField(
        "public username",
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Public slug used in booking links, e.g. /public/<username>/<slug>/.",
    )
    name = models.CharField(
        "full name",
        max_length=255,
    )
    timezone = models.CharField(
        "timezone",
        max_length=63,
        default="UTC",
        help_text="IANA timezone string, e.g. 'Asia/Kolkata', 'America/New_York'.",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email
