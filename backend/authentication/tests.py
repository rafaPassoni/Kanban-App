"""Testes de API para o app authentication (cookies httpOnly)."""

import pytest
from django.conf import settings
from django.contrib.auth.models import User


@pytest.mark.django_db
class TestTokenAuth:
    """Testes de obtencao e refresh de tokens JWT via cookies."""

    def test_obtain_token(self, anon_client):
        User.objects.create_user(username="jwt_user", password="pass1234")
        res = anon_client.post("/api/token/", {
            "username": "jwt_user", "password": "pass1234",
        })
        assert res.status_code == 200
        assert settings.JWT_COOKIE_ACCESS_NAME in res.cookies
        assert settings.JWT_COOKIE_REFRESH_NAME in res.cookies
        assert settings.JWT_COOKIE_AUTH_FLAG in res.cookies

    def test_obtain_token_invalid_credentials(self, anon_client):
        res = anon_client.post("/api/token/", {
            "username": "nobody", "password": "wrong",
        })
        assert res.status_code == 401

    def test_refresh_token(self, anon_client):
        User.objects.create_user(username="jwt_refresh", password="pass1234")
        # Login para obter cookies
        login_res = anon_client.post("/api/token/", {
            "username": "jwt_refresh", "password": "pass1234",
        })
        assert login_res.status_code == 200
        # O client do DRF repassa cookies automaticamente
        res = anon_client.post("/api/token/refresh/")
        assert res.status_code == 200
        assert settings.JWT_COOKIE_ACCESS_NAME in res.cookies


@pytest.mark.django_db
class TestUserEndpoints:
    """Testes de endpoints de usuario."""

    def test_current_user(self, admin_client, admin_user):
        res = admin_client.get("/api/users/me/")
        assert res.status_code == 200
        assert res.data["username"] == admin_user.username

    def test_current_user_anonymous(self, anon_client):
        res = anon_client.get("/api/users/me/")
        assert res.status_code == 401

    def test_full_access(self, admin_client, admin_user):
        res = admin_client.get("/api/users/me/full-access/")
        assert res.status_code == 200
        assert res.data["user"]["username"] == admin_user.username

    def test_full_access_anonymous(self, anon_client):
        res = anon_client.get("/api/users/me/full-access/")
        assert res.status_code == 401


@pytest.mark.django_db
class TestLogout:
    """Testes do endpoint de logout."""

    def test_logout_without_token(self, anon_client):
        res = anon_client.post("/api/logout/")
        assert res.status_code == 205

    def test_logout_with_refresh(self, anon_client):
        User.objects.create_user(username="jwt_logout", password="pass1234")
        # Login para obter cookies
        anon_client.post("/api/token/", {
            "username": "jwt_logout", "password": "pass1234",
        })
        # Logout — refresh token e lido do cookie
        res = anon_client.post("/api/logout/")
        assert res.status_code == 205
