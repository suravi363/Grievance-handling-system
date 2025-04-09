from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Grievance, Feedback
from users_app.models import CustomUser
import logging
import csv
from django.http import HttpResponse

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
    
    # Base queryset based on role
    if request.user.role in ['admin', 'employee']:
        grievances = Grievance.objects.all()  # Admins and employees see all grievances
    else:
        grievances = Grievance.objects.filter(user=request.user)  # Users see only their own
    
    # Apply filters for admin dashboard
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    category = request.GET.get('category')
    status_filter = request.GET.get('status')
    
    if start_date:
        grievances = grievances.filter(created_at__gte=start_date)
    if end_date:
        grievances = grievances.filter(created_at__lte=end_date)
    if category:
        grievances = grievances.filter(category=category)
    if status_filter:
        grievances = grievances.filter(status=status_filter)
    
    # Return data
    if request.user.role in ['admin', 'employee']:
        data = grievances.values('id', 'category', 'title', 'description', 'status', 'created_at', 'user__username')
    else:
        data = grievances.values('id', 'category', 'title', 'description', 'status', 'created_at')
    return Response(list(data), status=status.HTTP_200_OK)

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

@api_view(['POST'])
def submit_feedback(request):
    if not request.user.is_authenticated:
        logger.info("User not authenticated for submit_feedback")
        return Response({"message": "Login required"}, status=status.HTTP_401_UNAUTHORIZED)
    
    data = request.data
    grievance_id = data.get('grievance_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    try:
        grievance = Grievance.objects.get(id=grievance_id, user=request.user, status='Resolved')
        if Feedback.objects.filter(grievance=grievance).exists():
            logger.info(f"Feedback already submitted for grievance {grievance_id}")
            return Response({"message": "Feedback already submitted"}, status=status.HTTP_400_BAD_REQUEST)
        
        feedback = Feedback(grievance=grievance, user=request.user, rating=rating, comment=comment)
        feedback.save()
        logger.info(f"Feedback submitted for grievance {grievance_id}: Rating {rating}")

        try:
            send_mail(
                'Feedback Submitted',
                f'Thank you, {request.user.username}, for your feedback on "{grievance.title}".\nRating: {rating}\nComment: {comment}',
                settings.EMAIL_HOST_USER,
                [request.user.email or 'default@example.com'],
                fail_silently=False,
            )
            logger.info(f"Confirmation email sent to {request.user.email or 'default@example.com'}")
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return Response({"message": "Feedback saved, but email failed"}, status=status.HTTP_200_OK)
        
        return Response({"message": "Feedback submitted successfully!"}, status=status.HTTP_201_CREATED)
    except Grievance.DoesNotExist:
        logger.info(f"Grievance {grievance_id} not found or not resolved")
        return Response({"message": "Grievance not found or not resolved"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return Response({"message": f"Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def export_grievances_csv(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        logger.info(f"Permission denied for CSV export: User {request.user.username if request.user.is_authenticated else 'anonymous'}")
        return Response({"message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="grievances.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Category', 'Title', 'Description', 'Status', 'User', 'Created At'])
    
    grievances = Grievance.objects.all()
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    category = request.GET.get('category')
    status_filter = request.GET.get('status')
    
    if start_date:
        grievances = grievances.filter(created_at__gte=start_date)
    if end_date:
        grievances = grievances.filter(created_at__lte=end_date)
    if category:
        grievances = grievances.filter(category=category)
    if status_filter:
        grievances = grievances.filter(status=status_filter)
    
    for grievance in grievances:
        writer.writerow([grievance.id, grievance.category, grievance.title, grievance.description, grievance.status, grievance.user.username, grievance.created_at])
    
    logger.info(f"CSV exported by {request.user.username}")
    return response

@api_view(['GET'])
def get_efficiency_metrics(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        logger.info(f"Permission denied for efficiency metrics: User {request.user.username if request.user.is_authenticated else 'anonymous'}")
        return Response({"message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    
    resolved = Grievance.objects.filter(status='Resolved').count()
    total = Grievance.objects.count()
    efficiency = (resolved / total * 100) if total > 0 else 0
    logger.info(f"Efficiency metrics requested by {request.user.username}: {efficiency}%")
    return Response({"resolved": resolved, "total": total, "efficiency": efficiency}, status=status.HTTP_200_OK)