"""
Accounts app URL configuration.

Routes:
    /api/v1/accounts/   - Accounts root (health check placeholder)
"""

from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('', views.accounts_root, name='accounts-root'),
]
