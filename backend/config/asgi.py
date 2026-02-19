import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

django_asgi_app = get_asgi_application()

from django.conf import settings
from config.middleware import JWTAuthMiddleware
from apps.chat.routing import websocket_urlpatterns

_ws_stack = JWTAuthMiddleware(URLRouter(websocket_urlpatterns))

# AllowedHostsOriginValidator rejects connections whose Origin header host
# doesn't match ALLOWED_HOSTS.  In dev the app is served on a non-standard
# port (8080) so the browser sends Origin: http://localhost:8080 which
# fails the check.  The JWT token provides sufficient auth in both envs,
# so the validator is only applied in production.
if not settings.DEBUG:
    _ws_stack = AllowedHostsOriginValidator(_ws_stack)

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': _ws_stack,
})
