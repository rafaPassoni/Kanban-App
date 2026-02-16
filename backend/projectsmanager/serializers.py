"""Serializers do app projectsmanager.

Inclui campos derivados para reduzir logica e consultas no frontend.
"""

from rest_framework import serializers
from .models import Project, UserProjectAccess

class ProjectSerializer(serializers.ModelSerializer):
    """Serializa `Project` e expoe nomes legiveis de relacoes M2M."""
    responsible_collaborators_names = serializers.SerializerMethodField()
    used_by_departments_names = serializers.SerializerMethodField()
    user_can_view = serializers.SerializerMethodField()
    user_can_edit = serializers.SerializerMethodField()

    class Meta:
        """Lista campos explicitamente para evitar exposicao acidental."""
        model = Project
        fields = (
            'id', 'name', 'description', 'repo_url', 'admin_url', 'ports',
            'status', 'is_online', 'credential_user', 'credential_password',
            'readme', 'doc_changed_at',
            'responsible_collaborators', 'used_by_departments',
            'created_at', 'updated_at',
            'responsible_collaborators_names', 'used_by_departments_names',
            'user_can_view', 'user_can_edit',
        )

    def get_responsible_collaborators_names(self, obj):
        """Retorna apenas os nomes para facilitar renderizacao no cliente."""
        # Normaliza o retorno para evitar consultas repetidas no frontend.
        return [c.name for c in obj.responsible_collaborators.all()]

    def get_used_by_departments_names(self, obj):
        """Retorna nomes de departamentos para filtros e busca textual."""
        # Exibe nomes legiveis para facilitar filtros e buscas no frontend.
        return [d.name for d in obj.used_by_departments.all()]

    def _get_user_access(self, obj):
        """Retorna o UserProjectAccess do usuario atual (usando prefetch cache)."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None, None
        user = request.user
        if user.is_superuser or user.is_staff:
            return user, None
        # Usa o prefetch cache em vez de query individual por projeto
        for access in obj.user_accesses.all():
            if access.user_id == user.id:
                return user, access
        return user, None

    def get_user_can_view(self, obj):
        """Indica se o usuario atual pode visualizar este projeto."""
        user, access = self._get_user_access(obj)
        if user is None:
            return False
        if user.is_superuser or user.is_staff:
            return True
        if access is not None:
            return access.can_view
        return user.has_perm('projectsmanager.view_project') or \
               user.has_perm('projectsmanager.view_accesscenter')

    def get_user_can_edit(self, obj):
        """Indica se o usuario atual pode editar este projeto."""
        user, access = self._get_user_access(obj)
        if user is None:
            return False
        if user.is_superuser or user.is_staff:
            return True
        if access is not None:
            return access.can_edit
        return user.has_perm('projectsmanager.change_project')

    def to_internal_value(self, data):
        """Normaliza `is_online` quando chega como string em formularios."""
        # Converter string "True"/"False" para boolean
        if 'is_online' in data:
            value = data.get('is_online')
            if isinstance(value, str):
                data = data.copy() if hasattr(data, 'copy') else dict(data)
                data['is_online'] = value.lower() in ('true', '1', 'yes')
        return super().to_internal_value(data)
