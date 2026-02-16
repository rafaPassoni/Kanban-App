"""Serializers do app collaborators.

Expoem nomes derivados e contagens uteis para reduzir logica no frontend.
"""

from rest_framework import serializers
from .models import Collaborator, OrgchartEdge, OrgchartNote


class CollaboratorSerializer(serializers.ModelSerializer):
    """Serializa `Collaborator` com campos derivados para a UI."""
    department_name = serializers.CharField(source='department.name', read_only=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True, allow_null=True)
    managers_names = serializers.SerializerMethodField()
    subordinates_count = serializers.IntegerField(source='_subordinates_count', read_only=True, default=0)

    class Meta:
        """Inclui campos base e derivados, protegendo auditoria como read-only."""
        model = Collaborator
        fields = [
            'id', 'name', 'email', 'phone', 'position', 'leadership_role',
            'department', 'department_name', 'manager', 'manager_name', 'managers', 'managers_names',
            'hierarchy_order', 'orgchart_x', 'orgchart_y', 'orgchart_source_handle', 'orgchart_target_handle', 'subordinates_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_managers_names(self, obj):
        """Retorna apenas os nomes dos gestores para exibicao simples."""
        return [manager.name for manager in obj.managers.all()]


class OrgchartEdgeSerializer(serializers.ModelSerializer):
    """Serializa conexoes entre colaboradores no organograma."""
    class Meta:
        """Mantem o payload enxuto e com campos de auditoria read-only."""
        model = OrgchartEdge
        fields = [
            'id', 'source', 'target', 'source_handle', 'target_handle',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrgchartNoteSerializer(serializers.ModelSerializer):
    """Serializa notas posicionadas por setor no organograma."""
    class Meta:
        """Define os campos editaveis e protege ids/datas."""
        model = OrgchartNote
        fields = [
            'id', 'department', 'text', 'x', 'y', 'width', 'height',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
