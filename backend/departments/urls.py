"""Roteamento de URLs para o app departments."""

from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import DepartmentViewSet, DepartmentAccessView

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('departments/access/', DepartmentAccessView.as_view(), name='department-access'),
]
urlpatterns += router.urls
