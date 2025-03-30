from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Grievance
from users_app.models import CustomUser
import logging

# Set up logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
def submit_grievance(request):
    if not request.user.is_authenticated:
        return Response({"message": "Login required"}, status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    grievance = Grievance(
        user=request.user,
        category=data.get('category', 'General Issue'),
        title=data.get('title', 'Untitled'),
        description=data['description'],
        status="Pending"
    )
    grievance.save()
    return Response({"message": "Grievance submitted successfully!"}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_grievances(request):
    if not request.user.is_authenticated:
        return Response({"message": "Login required"}, status=status.HTTP_401_UNAUTHORIZED)
    if request.user.role == 'admin':
        grievances = Grievance.objects.all().values('id', 'category', 'title', 'description', 'status', 'created_at', 'user__username')
    else:
        grievances = Grievance.objects.filter(user=request.user).values('id', 'category', 'title', 'description', 'status', 'created_at')
    return Response(list(grievances), status=status.HTTP_200_OK)

@api_view(['POST'])
def update_grievance_status(request):
    if not request.user.is_authenticated:
        logger.info("User not authenticated for update_grievance_status")
        return Response({"message": "Login required"}, status=status.HTTP_401_UNAUTHORIZED)
    
    logger.info(f"User: {request.user.username}, Role: {request.user.role}")
    if request.user.role not in ['employee', 'admin']:
        logger.info(f"Permission denied for user {request.user.username} with role {request.user.role}")
        return Response({"message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    
    grievance_id = request.data.get('id')
    new_status = request.data.get('status')
    logger.info(f"Attempting to update grievance {grievance_id} to status {new_status}")
    
    try:
        grievance = Grievance.objects.get(id=grievance_id)
        if new_status in ['Pending', 'In Progress', 'Resolved']:
            grievance.status = new_status
            grievance.save()
            logger.info(f"Grievance {grievance_id} updated to {new_status}")
            return Response({"message": "Status updated successfully!"}, status=status.HTTP_200_OK)
        logger.info(f"Invalid status: {new_status}")
        return Response({"message": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
    except Grievance.DoesNotExist:
        logger.info(f"Grievance {grievance_id} not found")
        return Response({"message": "Grievance not found"}, status=status.HTTP_404_NOT_FOUND)