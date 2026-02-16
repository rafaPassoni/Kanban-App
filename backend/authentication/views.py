"""Views do app authentication.

Reune endpoints de JWT, contexto do usuario e inspecao de permissoes/grupos.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import Permission
from authentication.permission_checkers import get_user_permissions_dict


class CustomTokenObtainPairView(TokenObtainPairView):
    """Endpoint de login que emite o par JWT (access + refresh)."""
    serializer_class = TokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    """Endpoint que renova o access token a partir de um refresh valido."""
    serializer_class = TokenRefreshSerializer


class CurrentUserView(APIView):
    """Retorna um payload enxuto com dados do usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Serializa manualmente campos basicos do `request.user`."""
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
        })


class UserPermissionsView(APIView):
    """Lista os codenames de permissoes efetivas do usuario."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Une permissoes diretas e de grupos; superuser recebe todas."""
        user = request.user

        # Superusers recebem todas as permissoes cadastradas no sistema.
        if user.is_superuser:
            all_perms = Permission.objects.all().values_list('codename', flat=True)
            return Response({'permissions': sorted(all_perms)})

        # Usuarios normais: une permissoes diretas com as herdadas de grupos.
        user_perms = user.user_permissions.values_list('codename', flat=True)
        group_perms = user.groups.values_list('permissions__codename', flat=True)
        all_perms = sorted(set(user_perms).union(group_perms))
        return Response({'permissions': all_perms})


class UserGroupsView(APIView):
    """Retorna apenas os nomes dos grupos do usuario logado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Evita payloads grandes trazendo so `name` via values_list."""
        user_groups = request.user.groups.values_list('name', flat=True)
        return Response({'groups': list(user_groups)})


class AllPermissionsView(APIView):
    """Expoe todas as permissoes cadastradas, com metadados do content type."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Util para telas administrativas que precisam listar/filtrar permissoes."""
        all_permissions = Permission.objects.all().values(
            'id', 'codename', 'name', 'content_type__app_label', 'content_type__model'
        )
        return Response({'all_permissions': list(all_permissions)})


class FullUserAccessView(APIView):
    """Entrega usuario + permissoes organizadas por app/modelo."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Usa funcao centralizada para manter o formato consistente."""
        user = request.user
        permissions_dict = get_user_permissions_dict(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
                'groups': list(user.groups.values_list('name', flat=True)),
            },
            'permissions': permissions_dict,
        })


class LogoutView(APIView):
    """Efetua logout invalidando o refresh token (quando enviado)."""

    # AllowAny evita erro no cliente quando o token ja expirou/foi removido.
    permission_classes = [AllowAny]

    def post(self, request):
        """Tenta colocar o refresh na blacklist e sempre responde 205."""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                # Coloca refresh tokens na blacklist para evitar reutilizacao.
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            # Falhas aqui nao devem impedir o logout no cliente.
            pass
        return Response({ 'detail': 'Logged out' }, status=status.HTTP_205_RESET_CONTENT)
