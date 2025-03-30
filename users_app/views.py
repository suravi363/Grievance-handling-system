from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({"message": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        return Response({"message": "Login successful!", "role": user.role}, status=status.HTTP_200_OK)
    return Response({"message": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_user(request):
    logout(request)
    return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
