from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLES = (
        ('user', 'User'),
        ('employee', 'Employee'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLES, default='user')

    def __str__(self):
        return self.username
