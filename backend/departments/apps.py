"""Configuracao do app `departments` no Django."""

from django.apps import AppConfig


class DepartmentsConfig(AppConfig):
    """Define nome interno e rotulo exibido do app no Admin."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'departments'
    verbose_name = "Setores"
