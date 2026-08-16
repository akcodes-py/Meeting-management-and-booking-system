from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def calendar_root(request):
    """Health-check endpoint for the calendar_integration app."""
    return Response({
        'app': 'calendar_integration',
        'status': 'ok',
        'message': 'Calendar Integration API is operational. Endpoints will be added in the next task.',
    })
