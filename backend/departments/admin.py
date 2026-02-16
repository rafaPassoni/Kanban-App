"""Configuracao do Django Admin para setores e seus acessos."""

from django.contrib import admin
from .models import Department, DepartmentAccess


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Facilita busca e filtros de setores no Admin."""
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    list_per_page = 20
    date_hierarchy = 'created_at'


@admin.register(DepartmentAccess)
class DepartmentAccessAdmin(admin.ModelAdmin):
    """Ajuda a auditar quem tem acesso a cada setor."""
    list_display = ['user', 'department', 'created_at']
    list_filter = ['department', 'created_at']
    search_fields = ['user__username', 'user__email', 'department__name']
    list_per_page = 20
