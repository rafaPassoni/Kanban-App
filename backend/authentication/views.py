"""Views do app authentication.

Reune endpoints de JWT (com cookies httpOnly) e contexto do usuario.
"""

import logging

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers para cookies JWT
# ---------------------------------------------------------------------------

def _set_token_cookies(response, access: str, refresh: str | None = None):
    """Seta cookies httpOnly com os tokens JWT na response."""
    secure = not settings.DEBUG

    access_max_age = int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        key=settings.JWT_COOKIE_ACCESS_NAME,
        value=access,
        max_age=access_max_age,
        httponly=True,
        secure=secure,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path=settings.JWT_COOKIE_PATH,
    )

    if refresh is not None:
        refresh_max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
        response.set_cookie(
            key=settings.JWT_COOKIE_REFRESH_NAME,
            value=refresh,
            max_age=refresh_max_age,
            httponly=True,
            secure=secure,
            samesite=settings.JWT_COOKIE_SAMESITE,
            path=settings.JWT_COOKIE_PATH,
        )

    # Cookie nao-httpOnly para o frontend saber se esta autenticado
    response.set_cookie(
        key=settings.JWT_COOKIE_AUTH_FLAG,
        value="true",
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=False,
        secure=secure,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path=settings.JWT_COOKIE_PATH,
    )


def _clear_token_cookies(response):
    """Remove todos os cookies JWT da response."""
    for name in (
        settings.JWT_COOKIE_ACCESS_NAME,
        settings.JWT_COOKIE_REFRESH_NAME,
        settings.JWT_COOKIE_AUTH_FLAG,
    ):
        response.delete_cookie(name, path=settings.JWT_COOKIE_PATH)


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class CustomTokenObtainPairView(TokenObtainPairView):
    """Endpoint de login que emite o par JWT via cookies httpOnly."""
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access = response.data.get("access", "")
            refresh = response.data.get("refresh", "")
            _set_token_cookies(response, access=access, refresh=refresh)
            # Retorna confirmacao sem expor tokens no body
            response.data = {"detail": "Login realizado com sucesso."}

        return response


class CustomTokenRefreshView(TokenRefreshView):
    """Renova o access token lendo o refresh do cookie httpOnly."""

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.JWT_COOKIE_REFRESH_NAME)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token ausente."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)

            response = Response({"detail": "Token renovado."})
            new_refresh = None

            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS"):
                if settings.SIMPLE_JWT.get("BLACKLIST_AFTER_ROTATION"):
                    token.blacklist()
                token.set_jti()
                token.set_exp()
                token.set_iat()
                new_refresh = str(token)

            _set_token_cookies(response, access=access, refresh=new_refresh)
            return response

        except TokenError:
            resp = Response(
                {"detail": "Refresh token invalido ou expirado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _clear_token_cookies(resp)
            return resp


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
    """Efetua logout invalidando o refresh token e limpando cookies."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Blacklista o refresh token do cookie e limpa todos os cookies JWT."""
        refresh_token = request.COOKIES.get(settings.JWT_COOKIE_REFRESH_NAME)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError as exc:
                logger.warning("Falha ao blacklistar refresh token no logout: %s", exc)

        response = Response({"detail": "Logged out"}, status=status.HTTP_205_RESET_CONTENT)
        _clear_token_cookies(response)
        return response
