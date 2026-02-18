"""Roteamento raiz do projeto Django (Kanban).

Agrupa o admin e inclui as rotas versionadas de cada app.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),

    # Endpoints de autenticacao (JWT, usuario atual, logout).
    path('api/', include('authentication.urls')),

    # Endpoints principais, todos sob /api/v1/.
    path('api/v1/', include('projectsmanager.urls')),
    path('api/v1/', include('collaborators.urls')),
    path('api/v1/', include('departments.urls')),
    path('api/v1/', include('tasks.urls')),
]

# Serve uploads quando SERVE_MEDIA=True (desenvolvimento/VPS sem Nginx).
if settings.SERVE_MEDIA:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
