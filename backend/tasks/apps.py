"""Configuracao do app `tasks` no Django."""

from django.apps import AppConfig


class TasksConfig(AppConfig):
    """Define nome interno e rotulo exibido do app no Admin."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks'
    verbose_name = "Kanban"
