from django.urls import path
from .views import submit_grievance, get_grievances, update_grievance_status

urlpatterns = [
    path('submit/', submit_grievance, name='submit_grievance'),
    path('list/', get_grievances, name='get_grievances'),
    path('update/', update_grievance_status, name='update_grievance_status'),
]
