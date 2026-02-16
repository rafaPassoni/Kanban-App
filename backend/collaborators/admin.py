"""Configuracao do Django Admin para colaboradores."""

from django.contrib import admin
from .models import Collaborator


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
    """Melhora a gestao de colaboradores com filtros e busca."""
    list_display = ['name', 'email', 'position', 'department', 'is_active', 'created_at']
    list_filter = ['is_active', 'department', 'created_at']
    search_fields = ['name', 'email', 'position']
    list_per_page = 20
    date_hierarchy = 'created_at'
