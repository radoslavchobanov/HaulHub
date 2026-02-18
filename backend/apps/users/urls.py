from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('google/', views.google_auth, name='google-auth'),
    path('refresh/', views.refresh_token, name='token-refresh'),
    path('me/', views.me, name='me'),
    path('profile/', views.update_profile, name='update-profile'),
]
