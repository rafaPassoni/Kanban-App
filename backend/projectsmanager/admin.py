"""Configuracao do Django Admin para projetos."""

from django.contrib import admin
from projectsmanager.models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Melhora a listagem de projetos com campos chave e busca simples."""
    list_display = ('name', 'status', 'doc_changed_at', 'created_at', 'updated_at')
    search_fields = ('name', 'status')
