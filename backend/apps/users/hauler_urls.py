from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:pk>/', views.hauler_detail, name='hauler-detail'),
    path('<uuid:pk>/reviews/', views.hauler_reviews, name='hauler-reviews'),
]
