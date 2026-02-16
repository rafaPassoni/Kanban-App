"""Serializers do app departments.

Expoem setores com contagem derivada de colaboradores ativos.
"""

from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializa `Department` e adiciona campos calculados para a UI."""

    collaborators_count = serializers.SerializerMethodField()
    subdepartments = serializers.SerializerMethodField()

    class Meta:
        """Inclui campos derivados e protege ids/datas como somente leitura."""
        model = Department
        fields = [
            'id', 'name', 'description', 'department_type', 'parent_department', 'is_active',
            'collaborators_count', 'subdepartments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_collaborators_count(self, obj):
        """Conta apenas colaboradores ativos relacionados ao setor."""
        return obj.collaborators.filter(is_active=True).count()

    def get_subdepartments(self, obj):
        """Retorna subsetores apenas para setores principais."""
        if obj.department_type != Department.TYPE_MAIN:
            return []

        children = obj.subdepartments.all().order_by("name")
        return [
            {
                "id": child.id,
                "name": child.name,
                "description": child.description or "",
                "is_active": child.is_active,
            }
            for child in children
        ]
