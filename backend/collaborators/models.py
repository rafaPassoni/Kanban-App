"""Modelos do app collaborators.

Inclui colaboradores e estruturas auxiliares do organograma (arestas e notas).
"""

from django.db import models


class Collaborator(models.Model):
    """Representa uma pessoa colaboradora e sua posicao no organograma."""
    name = models.CharField(max_length=200, verbose_name="Nome")
    email = models.EmailField(unique=True, verbose_name="E-mail")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cargo")
    leadership_role = models.CharField(max_length=80, blank=True, null=True, verbose_name="Nivel de Lideranca")
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='collaborators',
        verbose_name="Setor",
        db_index=True
    )
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinates',
        verbose_name="Gestor/Líder",
        db_index=True
    )
    managers = models.ManyToManyField(
        "self",
        blank=True,
        symmetrical=False,
        related_name="reports",
        verbose_name="Gestores"
    )
    hierarchy_order = models.IntegerField(default=0, verbose_name="Ordem na Hierarquia", db_index=True)
    orgchart_x = models.IntegerField(null=True, blank=True, verbose_name="Posição X no organograma")
    orgchart_y = models.IntegerField(null=True, blank=True, verbose_name="Posição Y no organograma")
    orgchart_source_handle = models.CharField(max_length=32, null=True, blank=True, verbose_name="Orgchart source handle")
    orgchart_target_handle = models.CharField(max_length=32, null=True, blank=True, verbose_name="Orgchart target handle")
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

class OrgchartEdge(models.Model):
    """Persistencia das conexoes (linhas) entre colaboradores no organograma."""
    source = models.ForeignKey(
        'collaborators.Collaborator',
        on_delete=models.CASCADE,
        related_name='orgchart_edges_out',
        verbose_name='Origem'
    )
    target = models.ForeignKey(
        'collaborators.Collaborator',
        on_delete=models.CASCADE,
        related_name='orgchart_edges_in',
        verbose_name='Destino'
    )
    source_handle = models.CharField(max_length=32, null=True, blank=True, verbose_name='Source handle')
    target_handle = models.CharField(max_length=32, null=True, blank=True, verbose_name='Target handle')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        """Evita duplicar a mesma conexao origem->destino."""
        verbose_name = 'Aresta do organograma'
        verbose_name_plural = 'Arestas do organograma'
        constraints = [
            models.UniqueConstraint(fields=['source', 'target'], name='unique_orgchart_edge')
        ]

    def __str__(self):
        return f'{self.source_id} -> {self.target_id}'


class OrgchartNote(models.Model):
    """Notas livres posicionadas por setor no canvas do organograma."""
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        related_name='orgchart_notes',
        verbose_name='Setor',
        db_index=True
    )
    text = models.TextField(blank=True, default="", verbose_name='Texto')
    x = models.IntegerField(verbose_name='Posicao X')
    y = models.IntegerField(verbose_name='Posicao Y')
    width = models.IntegerField(null=True, blank=True, verbose_name='Largura')
    height = models.IntegerField(null=True, blank=True, verbose_name='Altura')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        """Metadados exibidos no Admin."""
        verbose_name = 'Nota do organograma'
        verbose_name_plural = 'Notas do organograma'

    def __str__(self):
        return f'Nota {self.id} ({self.department_id})'

