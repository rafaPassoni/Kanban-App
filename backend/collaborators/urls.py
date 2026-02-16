"""Roteamento de URLs para o app collaborators."""

from rest_framework.routers import DefaultRouter
from .views import CollaboratorViewSet, OrgchartEdgeViewSet, OrgchartNoteViewSet

router = DefaultRouter()
router.register(r'collaborators', CollaboratorViewSet, basename='collaborator')
router.register(r'orgchart-edges', OrgchartEdgeViewSet, basename='orgchart-edge')
router.register(r'orgchart-notes', OrgchartNoteViewSet, basename='orgchart-note')

urlpatterns = router.urls
