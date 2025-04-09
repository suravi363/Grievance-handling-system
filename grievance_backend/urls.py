from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = [
    path('admin/', admin.site.urls),
    path('grievances/', include('grievances.urls')),  # Include all grievance API endpoints
    path('users/', include('users_app.urls')),
    path('', TemplateView.as_view(template_name="index.html"), name='home'),
    path('dashboard/', login_required(TemplateView.as_view(template_name="dashboard.html")), name='dashboard'),
    path('employee/', login_required(TemplateView.as_view(template_name="employee_dashboard.html")), name='employee_dashboard'),
    path('admin-dashboard/', login_required(TemplateView.as_view(template_name="admin_dashboard.html")), name='admin_dashboard'),
    path('feedback/', login_required(TemplateView.as_view(template_name="feedback_form.html")), name='feedback_form'),
]