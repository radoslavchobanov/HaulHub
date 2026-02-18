from django.urls import path
from . import views

urlpatterns = [
    path('', views.wallet, name='wallet'),
    path('deposit/', views.deposit, name='deposit'),
    path('webhook/', views.stripe_webhook, name='stripe-webhook'),
]
