"""Roteamento raiz do projeto Django (Kanban).

Agrupa o admin e inclui as rotas versionadas de cada app.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Endpoints de autenticacao (JWT, usuario atual, permissoes, logout).
    path('api/', include('authentication.urls')),

    # Endpoints principais, todos sob /api/v1/.
    path('api/v1/', include('projectsmanager.urls')),
    path('api/v1/', include('collaborators.urls')),
    path('api/v1/', include('departments.urls')),
    path('api/v1/', include('tasks.urls')),
]

# Em desenvolvimento, serve uploads diretamente pelo Django.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT, insecure=True)
