"""Modelos do app collaborators."""

from django.db import models


class Collaborator(models.Model):
    """Representa uma pessoa colaboradora da organizacao."""
    name = models.CharField(max_length=200, verbose_name="Nome")
    email = models.EmailField(unique=True, verbose_name="E-mail")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cargo")
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='collaborators',
        verbose_name="Setor",
        db_index=True
    )
    is_active = models.BooleanField(default=True, verbose_name="Ativo", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        """Metadados para legibilidade no Admin e ordenacao padrao."""
        verbose_name = "Colaborador"
        verbose_name_plural = "Colaboradores"
        ordering = ['name']

    def __str__(self):
        return self.name

