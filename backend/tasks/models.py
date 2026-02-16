"""Modelos do app tasks.

Define projetos (cards do kanban), subtarefas e seus vinculos com responsaveis.
"""

from django.db import models


class Task(models.Model):
    """Representa um projeto no kanban com status, prioridade e relacoes."""

    STATUS_CHOICES = [
        ("TODO", "A Fazer"),
        ("IN_PROGRESS", "Em Progresso"),
        ("IN_REVIEW", "Em Revisão"),
        ("DONE", "Concluída"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Baixa"),
        ("MEDIUM", "Média"),
        ("HIGH", "Alta"),
        ("URGENT", "Urgente"),
    ]

    title = models.TextField(verbose_name="Nome")
    description = models.TextField(null=True, blank=True, verbose_name="Descrição")
    solution = models.TextField(null=True, blank=True, verbose_name="Solução")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="TODO",
        verbose_name="Status",
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="MEDIUM",
        verbose_name="Prioridade",
        db_index=True,
    )

    # Relacionamentos
    project = models.ForeignKey(
        "projectsmanager.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        verbose_name="Projeto Legado",
        db_index=True,
    )
    responsavel = models.ForeignKey(
        "collaborators.Collaborator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="responsible_tasks",
        verbose_name="Responsável",
        db_index=True,
    )
    assigned_to = models.ManyToManyField(
        "collaborators.Collaborator",
        blank=True,
        related_name="assigned_tasks",
        verbose_name="Atribuído a",
    )
    department = models.ManyToManyField(
        "departments.Department",
        blank=True,
        related_name="department_tasks",
        verbose_name="Setor",
    )

    # Ordenação e datas
    order = models.IntegerField(default=0, verbose_name="Ordem", db_index=True)
    start_date = models.DateField(null=True, blank=True, verbose_name="Data de Início")
    deadline = models.DateField(null=True, blank=True, verbose_name="Prazo")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Concluída Em")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado Em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado Em")

    class Meta:
        """Ordena por `order` e, em empate, pelas mais recentes."""
        verbose_name = "Projeto"
        verbose_name_plural = "Projetos"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Subtask(models.Model):
    """Representa uma subtarefa vinculada a uma `Task`."""

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks",
        verbose_name="Projeto",
        db_index=True,
    )
    title = models.TextField(verbose_name="Título")
    is_done = models.BooleanField(default=False, verbose_name="Concluída", db_index=True)
    order = models.IntegerField(default=0, verbose_name="Ordem", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criada Em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizada Em")

    class Meta:
        """Mantem a ordem manual e estabilidade por data de criacao."""
        verbose_name = "Subtarefa"
        verbose_name_plural = "Subtarefas"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.title} ({'OK' if self.is_done else 'Pendente'})"
