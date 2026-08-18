"""
Accounts app URL configuration.

Routes:
    /api/v1/auth/           - Accounts root (health check)
    /api/v1/auth/signup/    - Create account
    /api/v1/auth/login/     - Login
"""

from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("", views.accounts_root, name="accounts-root"),
    path("signup/", views.signup, name="signup"),
    path("login/", views.login, name="login"),
]