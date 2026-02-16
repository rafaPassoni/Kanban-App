"""Configuracao do app `projectsmanager` no Django."""

from django.apps import AppConfig


class ProjectsmanagerConfig(AppConfig):
    """Define nome interno e rotulo exibido do app no Admin."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'projectsmanager'
    verbose_name = "Projetos"
