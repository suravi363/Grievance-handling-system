from django.db import models
from users_app.models import CustomUser

class Grievance(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    category = models.CharField(max_length=50, default="General Issue")
    title = models.CharField(max_length=100, default="Untitled")
    description = models.TextField()
    status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed')
    ], default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.status}"
