"""Serializers do app tasks.

Expoem campos derivados e garantem consistencia de datas de conclusao.
"""

from django.utils import timezone
from rest_framework import serializers
from .models import Subtask, Task


class SubtaskSerializer(serializers.ModelSerializer):
    """Serializa subtarefas sem regras adicionais."""
    class Meta:
        """Mantem o serializer simples, espelhando o modelo."""
        model = Subtask
        fields = (
            'id', 'task', 'title', 'is_done', 'order',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class TaskSerializer(serializers.ModelSerializer):
    """Serializa tarefas (cards do kanban) com nomes derivados e regras de status/conclusao."""
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True, default=None)
    responsavel_name = serializers.CharField(source='responsavel.name', read_only=True, allow_null=True, default=None)
    assigned_to_names = serializers.SerializerMethodField()
    department_names = serializers.SerializerMethodField()
    subtasks = SubtaskSerializer(many=True, read_only=True)

    class Meta:
        """Inclui campos do modelo e os derivados acima."""
        model = Task
        fields = (
            'id', 'title', 'description', 'solution', 'status', 'priority',
            'project', 'responsavel', 'assigned_to', 'department',
            'order', 'start_date', 'deadline', 'completed_at',
            'created_at', 'updated_at',
            'project_name', 'responsavel_name', 'assigned_to_names',
            'department_names', 'subtasks',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_assigned_to_names(self, obj):
        """Retorna nomes dos responsaveis para evitar logica no frontend."""
        return [c.name for c in obj.assigned_to.all()]

    def get_department_names(self, obj):
        """Retorna nomes dos departamentos relacionados a tarefa."""
        return [d.name for d in obj.department.all()]

    def create(self, validated_data):
        """Define `completed_at` quando a tarefa ja nasce como DONE."""
        status = validated_data.get("status")
        # Registra data de conclusao ao criar como DONE.
        if status == "DONE" and not validated_data.get("completed_at"):
            validated_data["completed_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Mantem `completed_at` coerente com transicoes de status."""
        next_status = validated_data.get("status", instance.status)
        # Atualiza campo de conclusao conforme transicao de status.
        if instance.status != "DONE" and next_status == "DONE":
            validated_data["completed_at"] = timezone.now()
        elif instance.status == "DONE" and next_status != "DONE":
            validated_data["completed_at"] = None
        return super().update(instance, validated_data)


class PublicTaskSerializer(serializers.ModelSerializer):
    """Versao publica com campos restritos — sem dados sensiveis."""
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True, default=None)
    responsavel_name = serializers.CharField(source='responsavel.name', read_only=True, allow_null=True, default=None)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'status', 'priority', 'order',
            'deadline', 'completed_at',
            'project_name', 'responsavel_name',
        )
