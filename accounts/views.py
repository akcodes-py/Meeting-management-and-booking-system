from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def accounts_root(request):
    """Health-check endpoint for the accounts app."""
    return Response({
        'app': 'accounts',
        'status': 'ok',
        'message': 'Accounts API is operational. Endpoints will be added in the next task.',
    })
