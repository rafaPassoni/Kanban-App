"""Modelos do app projectsmanager."""

from django.db import models


class Project(models.Model):
    """Representa um projeto com links, status e relacionamentos de uso."""
    name = models.CharField(max_length=255, verbose_name='Nome do Projeto')
    description = models.TextField(null=True, blank=True, verbose_name='Descrição')
    repo_url = models.URLField(null=True, blank=True, verbose_name='URL Principal')
    admin_url = models.URLField(null=True, blank=True, verbose_name='URL Admin')
    ports = models.CharField(max_length=255, null=True, blank=True, verbose_name='Portas')
    status = models.CharField(max_length=255, null=True, blank=True, verbose_name='Status')
    is_online = models.BooleanField(default=False, verbose_name='Status Online')
    credential_user = models.CharField(max_length=255, null=True, blank=True, verbose_name='Usuário (credencial)')
    credential_password = models.CharField(max_length=255, null=True, blank=True, verbose_name='Senha (credencial)')
    readme = models.FileField(upload_to='projects/readmes/', null=True, blank=True, verbose_name='Readme (.md)')
    doc_changed_at = models.DateField(null=True, blank=True, verbose_name='Data de Alteração de Documentação')

    # Relacionamentos
    responsible_collaborators = models.ManyToManyField(
        'collaborators.Collaborator',
        blank=True,
        related_name='responsible_for_projects',
        verbose_name='Colaboradores Responsáveis'
    )
    used_by_departments = models.ManyToManyField(
        'departments.Department',
        blank=True,
        related_name='projects_used',
        verbose_name='Setores que Utilizam'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado Em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado Em')

    class Meta:
        """Metadados exibidos no Django Admin."""
        verbose_name = 'Projeto'
        verbose_name_plural = 'Projetos'

    def __str__(self):
        return self.name
