"""Roteamento de URLs para o app projectsmanager."""

from rest_framework.routers import DefaultRouter
from projectsmanager.views import ProjectViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='projects')

urlpatterns = router.urls
