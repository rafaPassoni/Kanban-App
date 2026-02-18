"""Modelos do app departments."""

from django.core.exceptions import ValidationError
from django.db import models


class Department(models.Model):
    """Representa um setor/departamento da organizacao."""

    TYPE_MAIN = "main"
    TYPE_SUB = "sub"
    TYPE_CHOICES = (
        (TYPE_MAIN, "Setor principal"),
        (TYPE_SUB, "Subsetor"),
    )

    name = models.CharField(max_length=100, verbose_name="Nome")
    description = models.TextField(blank=True, null=True, verbose_name="Descricao")
    department_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        default=TYPE_MAIN,
        verbose_name="Tipo",
    )
    parent_department = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subdepartments",
        verbose_name="Setor principal",
    )
    is_active = models.BooleanField(default=True, verbose_name="Ativo")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Setor"
        verbose_name_plural = "Setores"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def clean(self):
        # Valida regra de negocio: apenas subsetor aponta para setor pai.
        super().clean()
        if self.department_type == self.TYPE_MAIN:
            # Setor principal nunca deve manter vinculo de parent.
            self.parent_department = None
            return

        if self.parent_department is None:
            raise ValidationError({"parent_department": "Subsetor precisa de um setor principal."})

        if self.parent_department_id == self.id:
            raise ValidationError({"parent_department": "Um setor nao pode ser pai de si mesmo."})

        if self.parent_department.department_type != self.TYPE_MAIN:
            raise ValidationError({"parent_department": "O setor pai precisa ser um setor principal."})

    def save(self, *args, **kwargs):
        # Garante validacoes de hierarquia em qualquer caminho de persistencia.
        self.full_clean()
        return super().save(*args, **kwargs)
