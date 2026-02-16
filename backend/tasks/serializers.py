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
        fields = "__all__"

class TaskSerializer(serializers.ModelSerializer):
    """Serializa projetos (cards do kanban) com nomes derivados e regras de status/conclusao."""
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True, default=None)
    responsavel_name = serializers.CharField(source='responsavel.name', read_only=True, allow_null=True, default=None)
    assigned_to_names = serializers.SerializerMethodField()
    department_names = serializers.SerializerMethodField()
    subtasks = SubtaskSerializer(many=True, read_only=True)

    class Meta:
        """Inclui todos os campos do modelo e os derivados acima."""
        model = Task
        fields = '__all__'

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
