"""Configuracao do app `authentication` no Django."""

from django.apps import AppConfig

class AuthenticationConfig(AppConfig):
    """Define nome interno e rotulo exibido do app no Admin."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    verbose_name = "Autenticação"
