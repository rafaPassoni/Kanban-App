"""Views do app collaborators.

Fornece CRUD de colaboradores e dados persistidos do organograma.
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Collaborator, OrgchartEdge, OrgchartNote
from .serializers import CollaboratorSerializer, OrgchartEdgeSerializer, OrgchartNoteSerializer


class CollaboratorViewSet(viewsets.ModelViewSet):
    """CRUD de colaboradores com otimizacoes e filtro por ativo/inativo."""

    queryset = Collaborator.objects.select_related('department', 'manager').prefetch_related('subordinates', 'managers')
    serializer_class = CollaboratorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Aplica filtro opcional `?is_active=true|false` na listagem."""
        queryset = super().get_queryset()
        # Permite alternar ativos/inativos via querystring sem novos endpoints.
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class OrgchartEdgeViewSet(viewsets.ModelViewSet):
    """CRUD das conexoes (arestas) do organograma."""

    # Evita consultas extras ao serializar nomes/relacoes em lote.
    queryset = OrgchartEdge.objects.select_related('source', 'target')
    serializer_class = OrgchartEdgeSerializer
    permission_classes = [IsAuthenticated]


class OrgchartNoteViewSet(viewsets.ModelViewSet):
    """CRUD das notas do organograma, com filtro por setor."""

    queryset = OrgchartNote.objects.select_related('department')
    serializer_class = OrgchartNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra por `department` quando informado para reduzir payload."""
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        if department:
            # Filtra notas por setor para reduzir carga do organograma.
            queryset = queryset.filter(department_id=department)
        return queryset
