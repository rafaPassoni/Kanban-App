"""Configuracao do Django Admin para colaboradores."""

from django.contrib import admin
from .models import Collaborator, OrgchartEdge, OrgchartNote


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
    """Melhora a gestao de colaboradores com filtros e busca."""
    list_display = ['name', 'email', 'position', 'department', 'is_active', 'created_at']
    list_filter = ['is_active', 'department', 'created_at']
    search_fields = ['name', 'email', 'position']
    list_per_page = 20
    date_hierarchy = 'created_at'


@admin.register(OrgchartEdge)
class OrgchartEdgeAdmin(admin.ModelAdmin):
    """Gestao das conexoes do organograma no admin."""
    list_display = ['source', 'target', 'created_at']
    list_filter = ['created_at']
    search_fields = ['source__name', 'target__name']


@admin.register(OrgchartNote)
class OrgchartNoteAdmin(admin.ModelAdmin):
    """Gestao das notas do organograma no admin."""
    list_display = ['department', 'text', 'x', 'y', 'created_at']
    list_filter = ['department', 'created_at']
    search_fields = ['text']
