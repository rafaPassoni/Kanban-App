"""Views do app departments."""

from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD de setores com filtro simples por ativo/inativo."""

    queryset = (
        Department.objects
        .prefetch_related('collaborators', 'subdepartments')
        .annotate(_active_collaborators_count=Count(
            'collaborators', filter=Q(collaborators__is_active=True)
        ))
    )
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Aplica filtro opcional `?is_active=true|false` na listagem."""
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
