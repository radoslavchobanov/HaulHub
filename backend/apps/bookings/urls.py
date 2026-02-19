from django.urls import path
from . import views

urlpatterns = [
    path('mine/', views.my_bookings, name='my-bookings'),
    path('<uuid:pk>/', views.booking_detail, name='booking-detail'),

    # State machine transitions
    path('<uuid:pk>/confirm-pickup/', views.confirm_pickup, name='confirm-pickup'),
    path('<uuid:pk>/evidence/', views.upload_evidence, name='upload-evidence'),
    path('<uuid:pk>/mark-done/', views.mark_done, name='mark-done'),
    path('<uuid:pk>/complete/', views.confirm_complete, name='confirm-complete'),
    path('<uuid:pk>/dispute/', views.open_dispute, name='open-dispute'),
    path('<uuid:pk>/resolve/', views.resolve_booking, name='resolve-booking'),
    path('<uuid:pk>/no-show/', views.report_no_show, name='report-no-show'),
    # Scope amendment flow
    path('<uuid:pk>/amendments/', views.request_amendment, name='request-amendment'),
    path('<uuid:pk>/amendments/<uuid:amendment_pk>/', views.respond_amendment, name='respond-amendment'),
]
