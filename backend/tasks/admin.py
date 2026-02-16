"""Configuracao do Django Admin para tarefas do kanban."""

from django.contrib import admin
from .models import Subtask, Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Melhora a visualizacao com colunas derivadas de M2M."""
    list_display = ('title', 'project', 'status', 'priority', 'assigned_to_list', 'department_list', 'deadline')
    list_filter = ('status', 'priority', 'project', 'assigned_to', 'department')
    search_fields = ('title', 'description')
    ordering = ('order', '-created_at')

    @admin.display(description="Assigned To")
    def assigned_to_list(self, obj):
        """Mostra responsaveis como texto simples na listagem."""
        return ", ".join(obj.assigned_to.values_list("name", flat=True))

    @admin.display(description="Department")
    def department_list(self, obj):
        """Mostra departamentos relacionados de forma legivel."""
        return ", ".join(obj.department.values_list("name", flat=True))


@admin.register(Subtask)
class SubtaskAdmin(admin.ModelAdmin):
    """Gestao de subtarefas no admin."""
    list_display = ('title', 'task', 'is_done', 'order')
    list_filter = ('is_done',)
    search_fields = ('title',)
