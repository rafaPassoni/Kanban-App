"""Views do app projectsmanager."""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD de projetos com filtro opcional por departamento."""
    queryset = Project.objects.prefetch_related(
        'responsible_collaborators',
        'used_by_departments',
    )
    serializer_class = ProjectSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Aplica filtro opcional por departamento via query param."""
        queryset = super().get_queryset()
        department_id = self.request.query_params.get("department")
        if department_id:
            try:
                queryset = queryset.filter(used_by_departments__in=[int(department_id)])
            except (TypeError, ValueError):
                return queryset.none()
        return queryset
