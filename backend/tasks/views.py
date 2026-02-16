"""Views do app tasks (kanban).

Centraliza listagens com filtros por projeto/status/responsavel/departamento.
"""

from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Subtask, Task
from .serializers import SubtaskSerializer, TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    """CRUD de projetos (cards do kanban) com otimizacoes de queryset e filtros."""
    queryset = Task.objects.select_related('project', 'responsavel').prefetch_related('assigned_to', 'department').order_by('order', '-id')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Aplica filtros opcionais para reduzir payload e consultas no cliente."""
        queryset = super().get_queryset()

        project_id = self.request.query_params.get('project', None)
        status = self.request.query_params.get('status', None)
        assigned_to = self.request.query_params.get('assigned_to', None)
        department = self.request.query_params.get('department', None)
        responsavel = self.request.query_params.get('responsavel', None)

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if status:
            queryset = queryset.filter(status=status)
        if assigned_to:
            queryset = queryset.filter(assigned_to__id=assigned_to)
        if department:
            queryset = queryset.filter(department__id=department)
        if responsavel:
            queryset = queryset.filter(responsavel_id=responsavel)

        return queryset


class PublicTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """Versao publica (somente leitura) dos projetos."""
    queryset = Task.objects.select_related('project', 'responsavel').prefetch_related('assigned_to', 'department').order_by('order', '-id')
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]


class SubtaskViewSet(viewsets.ModelViewSet):
    """CRUD de subtarefas ordenadas por `order` e data de criacao."""
    queryset = Subtask.objects.select_related("task").order_by("order", "created_at")
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]
