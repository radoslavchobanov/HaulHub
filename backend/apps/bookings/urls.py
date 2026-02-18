from django.urls import path
from . import views

urlpatterns = [
    path('mine/', views.my_bookings, name='my-bookings'),
    path('<uuid:pk>/', views.booking_detail, name='booking-detail'),
    path('<uuid:pk>/complete/', views.complete_booking, name='complete-booking'),
]
