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

    # ---- Create
    def test_create(self, admin_client):
        res = admin_client.post(self.url, {
            "name": "Novo Projeto", "description": "Desc",
        })
        assert res.status_code == 201
        assert res.data["name"] == "Novo Projeto"

    def test_create_viewer_forbidden(self, viewer_client):
        res = viewer_client.post(self.url, {"name": "Nope"})
        assert res.status_code == 403

    # ---- Update
    def test_update(self, admin_client, project):
        res = admin_client.patch(
            self.detail_url(project.id), {"name": "Projeto Renomeado"}
        )
        assert res.status_code == 200
        assert res.data["name"] == "Projeto Renomeado"

    def test_update_viewer_forbidden(self, viewer_client, project):
        res = viewer_client.patch(
            self.detail_url(project.id), {"name": "Nope"}
        )
        assert res.status_code == 403

    # ---- Delete
    def test_delete(self, admin_client, project):
        res = admin_client.delete(self.detail_url(project.id))
        assert res.status_code == 204
        assert not Project.objects.filter(id=project.id).exists()

    def test_delete_viewer_forbidden(self, viewer_client, project):
        res = viewer_client.delete(self.detail_url(project.id))
        assert res.status_code == 403

    # ---- Retrieve
    def test_retrieve(self, admin_client, project):
        res = admin_client.get(self.detail_url(project.id))
        assert res.status_code == 200
        assert res.data["name"] == project.name
