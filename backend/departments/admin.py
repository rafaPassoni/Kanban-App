"""Configuracao do Django Admin para setores."""

from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Facilita busca e filtros de setores no Admin."""
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    list_per_page = 20
    date_hierarchy = 'created_at'
