"""Roteamento de URLs para o app tasks."""

from rest_framework.routers import DefaultRouter
from .views import PublicTaskViewSet, SubtaskViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'tasks-public', PublicTaskViewSet, basename='task-public')
router.register(r'subtasks', SubtaskViewSet, basename='subtask')

urlpatterns = router.urls
