"""Views do app departments.

Inclui CRUD de setores e um endpoint de setores acessiveis por usuario.
"""

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Department, DepartmentAccess
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD de setores com filtro simples por ativo/inativo."""

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Aplica filtro opcional `?is_active=true|false` na listagem."""
        queryset = super().get_queryset()
        # Permite alternar ativos/inativos via querystring sem novos endpoints.
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class DepartmentAccessView(APIView):
    """Lista os setores que o usuario autenticado pode visualizar."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Staff/superuser ve tudo; demais usuarios veem apenas acessos concedidos."""
        user = request.user
        # Staff tem acesso completo; usuarios comuns ficam restritos ao acesso concedido.
        if user.is_superuser or user.is_staff or user.has_perm("projectsmanager.view_accesscenter"):
            queryset = Department.objects.all()
        else:
            queryset = Department.objects.filter(user_accesses__user=user)
        serializer = DepartmentSerializer(queryset, many=True)
        return Response(serializer.data)
