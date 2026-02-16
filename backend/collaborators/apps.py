"""Configuracao do app `collaborators` no Django."""

from django.apps import AppConfig


class CollaboratorsConfig(AppConfig):
    """Define nome interno e rotulo exibido do app no Admin."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'collaborators'
    verbose_name = "Colaboradores"
