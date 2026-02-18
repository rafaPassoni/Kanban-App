"""Serializers do app projectsmanager."""

from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    """Serializa `Project` e expoe nomes legiveis de relacoes M2M."""
    responsible_collaborators_names = serializers.SerializerMethodField()
    used_by_departments_names = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'description', 'repo_url', 'admin_url', 'ports',
            'status', 'is_online', 'credential_user', 'credential_password',
            'readme', 'doc_changed_at',
            'responsible_collaborators', 'used_by_departments',
            'created_at', 'updated_at',
            'responsible_collaborators_names', 'used_by_departments_names',
        )

    def get_responsible_collaborators_names(self, obj):
        """Retorna apenas os nomes para facilitar renderizacao no cliente."""
        return [c.name for c in obj.responsible_collaborators.all()]

    def get_used_by_departments_names(self, obj):
        """Retorna nomes de departamentos para filtros e busca textual."""
        return [d.name for d in obj.used_by_departments.all()]

    def to_internal_value(self, data):
        """Normaliza `is_online` quando chega como string em formularios."""
        if 'is_online' in data:
            value = data.get('is_online')
            if isinstance(value, str):
                data = data.copy() if hasattr(data, 'copy') else dict(data)
                data['is_online'] = value.lower() in ('true', '1', 'yes')
        return super().to_internal_value(data)
