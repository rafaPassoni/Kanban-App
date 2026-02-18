"""Views do app collaborators."""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Collaborator
from .serializers import CollaboratorSerializer


class CollaboratorViewSet(viewsets.ModelViewSet):
    """CRUD de colaboradores com otimizacoes e filtro por ativo/inativo."""

    queryset = Collaborator.objects.select_related('department')
    serializer_class = CollaboratorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Aplica filtro opcional `?is_active=true|false` na listagem."""
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
