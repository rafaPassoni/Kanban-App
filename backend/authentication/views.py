"""Views do app authentication.

Reune endpoints de JWT e contexto do usuario.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken


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


class FullUserAccessView(APIView):
    """Retorna dados do usuario autenticado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna dados do usuario sem informacoes de permissao."""
        user = request.user
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
            },
        })


class LogoutView(APIView):
    """Efetua logout invalidando o refresh token (quando enviado)."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Tenta colocar o refresh na blacklist e sempre responde 205."""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({ 'detail': 'Logged out' }, status=status.HTTP_205_RESET_CONTENT)
