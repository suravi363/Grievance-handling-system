from django.urls import path
from .views import (
    submit_grievance,
    get_grievances,
    update_grievance_status,
    submit_feedback,
    export_grievances_csv,
    get_efficiency_metrics
)

urlpatterns = [
    path('submit/', submit_grievance),
    path('list/', get_grievances),
    path('update/', update_grievance_status),
    path('submit_feedback/', submit_feedback, name='submit_feedback'),
    path('export_csv/', export_grievances_csv, name='export_grievances_csv'),
    path('efficiency_metrics/', get_efficiency_metrics, name='efficiency_metrics'),
]