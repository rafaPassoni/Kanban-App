"""Views do app projectsmanager.

Aplica regras de permissao e escopo por departamento na listagem de projetos.
"""

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from authentication.permission_checkers import GranularProjectPermissions
from .models import Project, UserProjectAccess
from .serializers import ProjectSerializer
from departments.models import DepartmentAccess

class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD de projetos com controle fino via permissões granulares."""
    queryset = Project.objects.prefetch_related('responsible_collaborators', 'used_by_departments')
    serializer_class = ProjectSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated, GranularProjectPermissions]

    def _filter_by_department(self, queryset):
        """Aplica filtro opcional por departamento via query param."""
        department_id = self.request.query_params.get("department")
        if department_id:
            try:
                queryset = queryset.filter(used_by_departments__in=[int(department_id)])
            except (TypeError, ValueError):
                return queryset.none()
        return queryset

    def get_queryset(self):
        """Filtra projetos por permissões granulares + departamentos."""
        queryset = super().get_queryset()
        user = self.request.user

        # Superuser e staff veem tudo
        if user.is_superuser or user.is_staff:
            return self._filter_by_department(queryset)

        # Usuários regulares: filtra por acesso granular (projetos + departamentos)
        user_project_ids = UserProjectAccess.objects.filter(
            user=user, can_view=True
        ).values_list('project_id', flat=True)

        allowed_dept_ids = DepartmentAccess.objects.filter(
            user=user
        ).values_list("department_id", flat=True)

        conditions = Q()
        if user_project_ids:
            conditions |= Q(id__in=user_project_ids)
        if allowed_dept_ids:
            conditions |= Q(used_by_departments__in=allowed_dept_ids)

        if conditions:
            queryset = queryset.filter(conditions).distinct()
        else:
            return queryset.none()

        return self._filter_by_department(queryset).distinct()
