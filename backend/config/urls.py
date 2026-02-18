from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/jobs/', include('apps.jobs.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/wallet/', include('apps.payments.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/haulers/', include('apps.users.hauler_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
