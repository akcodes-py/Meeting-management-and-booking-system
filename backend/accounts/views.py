"""
Authentication views.

    POST /api/v1/auth/signup/  -> create an account, return JWT tokens
    POST /api/v1/auth/login/   -> validate credentials, return JWT tokens

Tokens are issued with rest_framework_simplejwt; host-only endpoints are
protected by the default IsAuthenticated + JWTAuthentication setup.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import OpenApiTypes, extend_schema

from .serializers import LoginSerializer, SignupSerializer, UserSerializer


@extend_schema(tags=["Health"], responses={200: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
def accounts_root(request):
    """Health-check endpoint for the accounts app."""
    return Response({"app": "accounts", "status": "ok"})


@extend_schema(
    tags=["Auth"],
    request=SignupSerializer,
    responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    """Create a user and return JWT tokens for immediate login."""
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(
    tags=["Auth"],
    request=LoginSerializer,
    responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """Authenticate an existing user and return JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
    )