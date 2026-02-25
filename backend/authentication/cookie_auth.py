"""Autenticacao JWT via cookie httpOnly.

Estende JWTAuthentication do SimpleJWT para ler o token
do cookie quando o header Authorization nao estiver presente.
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Tenta header Authorization primeiro; se ausente, le cookie httpOnly."""

    def authenticate(self, request):
        # Tenta autenticacao via header (compatibilidade com API clients)
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        # Fallback: le access token do cookie httpOnly
        raw_token = request.COOKIES.get(settings.JWT_COOKIE_ACCESS_NAME)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
