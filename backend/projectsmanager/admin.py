"""Configuracao do Django Admin para projetos e central de acessos."""

from django.contrib import admin
from projectsmanager.models import Project, AccessCenter, UserProjectAccess


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Melhora a listagem de projetos com campos chave e busca simples."""
    list_display = ('name', 'status', 'doc_changed_at', 'created_at', 'updated_at')
    search_fields = ('name', 'status')


@admin.register(AccessCenter)
class AccessCenterAdmin(admin.ModelAdmin):
    """Admin separado para o proxy `AccessCenter` (visualizacao controlada)."""
    list_display = ('name', 'status', 'doc_changed_at', 'created_at', 'updated_at')
    search_fields = ('name', 'status')


@admin.register(UserProjectAccess)
class UserProjectAccessAdmin(admin.ModelAdmin):
    """Admin separado para gerenciar acessos granulares."""
    list_display = ('user', 'project', 'can_view', 'can_edit', 'created_at')
    list_filter = ('can_view', 'can_edit', 'created_at', 'project')
    search_fields = ('user__username', 'user__email', 'project__name')
    autocomplete_fields = ['user', 'project']
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Vínculo', {
            'fields': ('user', 'project')
        }),
        ('Permissões', {
            'fields': ('can_view', 'can_edit'),
            'description': 'Defina quais ações o usuário pode realizar neste projeto'
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
