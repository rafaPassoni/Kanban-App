"""Modelos do app projectsmanager.

Define projetos, seus vinculos e um proxy para a "Central de Acessos".
"""

from django.db import models
from django.conf import settings


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


class AccessCenter(Project):
    """Proxy de `Project` para restringir permissoes a visualizacao."""
    class Meta:
        """Nao cria tabela nova; apenas muda permissoes e rotulos no Admin."""
        proxy = True
        default_permissions = ("view",)
        verbose_name = "Central de Acessos"
        verbose_name_plural = "Central de Acessos"


class UserProjectAccess(models.Model):
    """
    Controla permissões granulares de usuários sobre projetos específicos.
    Permite que admins definam exatamente quais projetos um usuário pode ver/editar.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_accesses',
        verbose_name='Usuário'
    )
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='user_accesses',
        verbose_name='Projeto'
    )
    can_view = models.BooleanField(
        default=True,
        verbose_name='Pode Visualizar',
        help_text='Permite que o usuário veja este projeto na Central de Acessos'
    )
    can_edit = models.BooleanField(
        default=False,
        verbose_name='Pode Editar',
        help_text='Permite que o usuário edite este projeto'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado Em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado Em')

    class Meta:
        verbose_name = 'Acesso de Usuário a Projeto'
        verbose_name_plural = 'Acessos de Usuários a Projetos'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'project'],
                name='unique_user_project_access'
            )
        ]
        ordering = ['-created_at']

    def __str__(self):
        permissions = []
        if self.can_view:
            permissions.append('visualizar')
        if self.can_edit:
            permissions.append('editar')
        return f"{self.user.username} -> {self.project.name} ({', '.join(permissions)})"
