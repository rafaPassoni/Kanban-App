"""Testes de API para o app authentication."""

import pytest
from django.contrib.auth.models import User


@pytest.mark.django_db
class TestTokenAuth:
    """Testes de obtencao e refresh de tokens JWT."""

    def test_obtain_token(self, anon_client):
        User.objects.create_user(username="jwt_user", password="pass1234")
        res = anon_client.post("/api/token/", {
            "username": "jwt_user", "password": "pass1234",
        })
        assert res.status_code == 200
        assert "access" in res.data
        assert "refresh" in res.data

    def test_obtain_token_invalid_credentials(self, anon_client):
        res = anon_client.post("/api/token/", {
            "username": "nobody", "password": "wrong",
        })
        assert res.status_code == 401

    def test_refresh_token(self, anon_client):
        User.objects.create_user(username="jwt_refresh", password="pass1234")
        token_res = anon_client.post("/api/token/", {
            "username": "jwt_refresh", "password": "pass1234",
        })
        refresh = token_res.data["refresh"]
        res = anon_client.post("/api/token/refresh/", {"refresh": refresh})
        assert res.status_code == 200
        assert "access" in res.data


@pytest.mark.django_db
class TestUserEndpoints:
    """Testes de endpoints de usuario e permissoes."""

    def test_current_user(self, admin_client, admin_user):
        res = admin_client.get("/api/users/me/")
        assert res.status_code == 200
        assert res.data["username"] == admin_user.username

    def test_current_user_anonymous(self, anon_client):
        res = anon_client.get("/api/users/me/")
        assert res.status_code == 401

    def test_user_permissions(self, admin_client):
        res = admin_client.get("/api/users/me/permissions/")
        assert res.status_code == 200
        assert "permissions" in res.data
        assert isinstance(res.data["permissions"], list)

    def test_full_access(self, admin_client, admin_user):
        res = admin_client.get("/api/users/me/full-access/")
        assert res.status_code == 200
        assert res.data["user"]["username"] == admin_user.username
        assert "permissions" in res.data


@pytest.mark.django_db
class TestLogout:
    """Testes do endpoint de logout."""

    def test_logout_without_token(self, anon_client):
        res = anon_client.post("/api/logout/")
        assert res.status_code == 205

    def test_logout_with_refresh(self, anon_client):
        User.objects.create_user(username="jwt_logout", password="pass1234")
        token_res = anon_client.post("/api/token/", {
            "username": "jwt_logout", "password": "pass1234",
        })
        refresh = token_res.data["refresh"]
        res = anon_client.post("/api/logout/", {"refresh": refresh})
        assert res.status_code == 205
