"""Serializers do app collaborators.

Expoem nomes derivados e contagens uteis para reduzir logica no frontend.
"""

from rest_framework import serializers
from .models import Collaborator


class CollaboratorSerializer(serializers.ModelSerializer):
    """Serializa `Collaborator` com campos derivados para a UI."""
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        """Inclui campos base e derivados, protegendo auditoria como read-only."""
        model = Collaborator
        fields = [
            'id', 'name', 'email', 'phone', 'position',
            'department', 'department_name', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
