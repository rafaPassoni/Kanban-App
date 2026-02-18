"""Testes de API para o app collaborators."""

import pytest
from collaborators.models import Collaborator


@pytest.mark.django_db
class TestCollaboratorAPI:
    """Testes do endpoint /api/v1/collaborators/."""

    url = "/api/v1/collaborators/"

    def detail_url(self, pk):
        return f"{self.url}{pk}/"

    # ---- List
    def test_list(self, admin_client, collaborator):
        res = admin_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 1

    def test_list_anonymous_forbidden(self, anon_client):
        res = anon_client.get(self.url)
        assert res.status_code == 401

    # ---- Filter
    def test_filter_active(self, admin_client, collaborator):
        res = admin_client.get(self.url, {"is_active": "true"})
        assert res.status_code == 200
        assert all(c["is_active"] for c in res.data["results"])

    # ---- Create
    def test_create(self, admin_client, department):
        res = admin_client.post(self.url, {
            "name": "Maria Souza",
            "email": "maria@test.com",
            "position": "Analista",
            "department": department.id,
        })
        assert res.status_code == 201
        assert res.data["name"] == "Maria Souza"

    def test_create_regular_user(self, auth_client, department):
        """Qualquer usuario autenticado pode criar colaboradores."""
        res = auth_client.post(self.url, {
            "name": "Pedro Lima", "email": "pedro@test.com",
            "department": department.id,
        })
        assert res.status_code == 201

    def test_create_duplicate_email(self, admin_client, collaborator):
        res = admin_client.post(self.url, {
            "name": "Duplicado", "email": collaborator.email,
        })
        assert res.status_code == 400

    # ---- Update
    def test_update(self, admin_client, collaborator):
        res = admin_client.patch(
            self.detail_url(collaborator.id), {"position": "Senior Dev"}
        )
        assert res.status_code == 200
        assert res.data["position"] == "Senior Dev"

    # ---- Delete
    def test_delete(self, admin_client, collaborator):
        res = admin_client.delete(self.detail_url(collaborator.id))
        assert res.status_code == 204
        assert not Collaborator.objects.filter(id=collaborator.id).exists()
