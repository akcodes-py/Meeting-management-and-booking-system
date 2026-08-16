from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def meetings_root(request):
    """Health-check endpoint for the meetings app."""
    return Response({
        'app': 'meetings',
        'status': 'ok',
        'message': 'Meetings API is operational. Endpoints will be added in the next task.',
    })
