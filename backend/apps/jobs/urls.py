from django.urls import path
from . import views

urlpatterns = [
    path('', views.jobs, name='jobs'),
    path('mine/', views.my_jobs, name='my-jobs'),
    path('applications/mine/', views.my_applications, name='my-applications'),
    path('<uuid:pk>/', views.job_detail, name='job-detail'),
    path('<uuid:pk>/applications/', views.job_applications, name='job-applications'),
    path('applications/<uuid:pk>/', views.application_detail, name='application-detail'),
]
