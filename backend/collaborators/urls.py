"""Roteamento de URLs para o app collaborators."""

from rest_framework.routers import DefaultRouter
from .views import CollaboratorViewSet

router = DefaultRouter()
router.register(r'collaborators', CollaboratorViewSet, basename='collaborator')

urlpatterns = router.urls
