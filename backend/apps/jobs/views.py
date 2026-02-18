from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Job, JobApplication
from .serializers import JobSerializer, CreateJobSerializer, JobApplicationSerializer


@api_view(['GET', 'POST'])
def jobs(request):
    if request.method == 'GET':
        qs = Job.objects.filter(status='open').select_related('client', 'client__hauler_profile')

        # Optional category filter
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        return Response(JobSerializer(qs, many=True, context={'request': request}).data)

    if request.method == 'POST':
        if request.user.user_type != 'client':
            return Response({'error': 'Only clients can post jobs.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateJobSerializer(data=request.data)
        if serializer.is_valid():
            job = serializer.save(client=request.user)
            return Response(JobSerializer(job, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
def job_detail(request, pk):
    try:
        job = Job.objects.select_related('client').get(id=pk)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(JobSerializer(job, context={'request': request}).data)

    if request.method == 'PATCH':
        if job.client != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        action = request.data.get('action')
        if action == 'cancel' and job.status == 'open':
            job.status = 'cancelled'
            job.save(update_fields=['status', 'updated_at'])
            return Response(JobSerializer(job).data)
        return Response({'error': 'Invalid action or job cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def my_jobs(request):
    if request.user.user_type != 'client':
        return Response({'error': 'Only clients can view their jobs.'}, status=status.HTTP_403_FORBIDDEN)
    jobs_qs = Job.objects.filter(client=request.user).prefetch_related('applications')
    return Response(JobSerializer(jobs_qs, many=True, context={'request': request}).data)


@api_view(['GET', 'POST'])
def job_applications(request, pk):
    try:
        job = Job.objects.get(id=pk)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if job.client != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        apps = job.applications.select_related('hauler', 'hauler__hauler_profile')
        return Response(JobApplicationSerializer(apps, many=True).data)

    if request.method == 'POST':
        if request.user.user_type != 'hauler':
            return Response({'error': 'Only haulers can apply to jobs.'}, status=status.HTTP_403_FORBIDDEN)
        if job.status != 'open':
            return Response({'error': 'This job is no longer accepting applications.'}, status=status.HTTP_400_BAD_REQUEST)
        if job.client == request.user:
            return Response({'error': 'You cannot apply to your own job.'}, status=status.HTTP_400_BAD_REQUEST)
        if JobApplication.objects.filter(job=job, hauler=request.user).exists():
            return Response({'error': 'You have already applied to this job.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = JobApplicationSerializer(data=request.data)
        if serializer.is_valid():
            app = serializer.save(job=job, hauler=request.user)
            return Response(JobApplicationSerializer(app).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
def application_detail(request, pk):
    try:
        app = JobApplication.objects.select_related('job', 'hauler').get(id=pk)
    except JobApplication.DoesNotExist:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    if app.job.client != request.user:
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    action = request.data.get('action')

    if action == 'reject':
        app.status = 'rejected'
        app.save(update_fields=['status'])
        return Response(JobApplicationSerializer(app).data)

    if action == 'accept':
        if app.job.status != 'open':
            return Response({'error': 'This job is no longer available.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.payments.models import Wallet, Transaction
        from apps.bookings.models import Booking
        from apps.chat.models import ChatRoom

        try:
            client_wallet = Wallet.objects.get(user=request.user)
        except Wallet.DoesNotExist:
            return Response({'error': 'Wallet not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if client_wallet.available_balance < app.job.budget:
            return Response(
                {'error': 'Insufficient wallet balance. Please deposit funds before accepting.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            client_wallet = Wallet.objects.select_for_update().get(user=request.user)
            client_wallet.available_balance -= app.job.budget
            client_wallet.escrow_balance += app.job.budget
            client_wallet.save()

            Transaction.objects.create(
                wallet=client_wallet,
                transaction_type='escrow_lock',
                amount=app.job.budget,
                reference_id=str(app.job.id),
                description=f'Escrow locked for: {app.job.title}',
            )

            now = timezone.now()
            booking = Booking.objects.create(
                job=app.job,
                client=request.user,
                hauler=app.hauler,
                amount=app.job.budget,
                escrow_locked_at=now,
                auto_release_at=now + timedelta(days=14),
            )

            ChatRoom.objects.create(booking=booking)

            app.job.status = 'assigned'
            app.job.save(update_fields=['status', 'updated_at'])

            app.status = 'accepted'
            app.save(update_fields=['status'])

            JobApplication.objects.filter(job=app.job).exclude(id=app.id).update(status='rejected')

        return Response(JobApplicationSerializer(app).data)

    return Response({'error': 'Invalid action. Use "accept" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def my_applications(request):
    if request.user.user_type != 'hauler':
        return Response({'error': 'Only haulers can view their applications.'}, status=status.HTTP_403_FORBIDDEN)
    apps = JobApplication.objects.filter(hauler=request.user).select_related(
        'job', 'job__client'
    )
    return Response(JobApplicationSerializer(apps, many=True).data)
