"""Testes de API para o app projectsmanager."""

import pytest
from projectsmanager.models import Project


@pytest.mark.django_db
class TestProjectAPI:
    """Testes do endpoint /api/v1/projects/."""

    url = "/api/v1/projects/"

    def detail_url(self, pk):
        return f"{self.url}{pk}/"

    # ---- List
    def test_list(self, admin_client, project):
        res = admin_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 1

    def test_list_anonymous_forbidden(self, anon_client):
        res = anon_client.get(self.url)
        assert res.status_code == 401

    def test_list_regular_user(self, auth_client, project):
        """Qualquer usuario autenticado pode listar projetos."""
        res = auth_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 1

    # ---- Create
    def test_create(self, admin_client):
        res = admin_client.post(self.url, {
            "name": "Novo Projeto", "description": "Desc",
        })
        assert res.status_code == 201
        assert res.data["name"] == "Novo Projeto"

    def test_create_regular_user(self, auth_client):
        """Qualquer usuario autenticado pode criar projetos."""
        res = auth_client.post(self.url, {"name": "Projeto Regular"})
        assert res.status_code == 201

    # ---- Update
    def test_update(self, admin_client, project):
        res = admin_client.patch(
            self.detail_url(project.id), {"name": "Projeto Renomeado"}
        )
        assert res.status_code == 200
        assert res.data["name"] == "Projeto Renomeado"

    # ---- Delete
    def test_delete(self, admin_client, project):
        res = admin_client.delete(self.detail_url(project.id))
        assert res.status_code == 204
        assert not Project.objects.filter(id=project.id).exists()

    # ---- Retrieve
    def test_retrieve(self, admin_client, project):
        res = admin_client.get(self.detail_url(project.id))
        assert res.status_code == 200
        assert res.data["name"] == project.name
