"""Testes de API para o app departments."""

import pytest
from departments.models import Department


@pytest.mark.django_db
class TestDepartmentAPI:
    """Testes do endpoint /api/v1/departments/."""

    url = "/api/v1/departments/"

    def detail_url(self, pk):
        return f"{self.url}{pk}/"

    # ---- List
    def test_list(self, admin_client, department):
        res = admin_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 1

    def test_list_anonymous_forbidden(self, anon_client):
        res = anon_client.get(self.url)
        assert res.status_code == 401

    # ---- Create
    def test_create(self, admin_client):
        res = admin_client.post(self.url, {
            "name": "Marketing", "department_type": "main",
        })
        assert res.status_code == 201
        assert res.data["name"] == "Marketing"

    def test_create_regular_user(self, auth_client):
        """Qualquer usuario autenticado pode criar departamentos."""
        res = auth_client.post(self.url, {
            "name": "RH", "department_type": "main",
        })
        assert res.status_code == 201

    # ---- Update
    def test_update(self, admin_client, department):
        res = admin_client.patch(
            self.detail_url(department.id), {"name": "TI Atualizado"}
        )
        assert res.status_code == 200
        assert res.data["name"] == "TI Atualizado"

    # ---- Delete
    def test_delete(self, admin_client, department):
        res = admin_client.delete(self.detail_url(department.id))
        assert res.status_code == 204
        assert not Department.objects.filter(id=department.id).exists()

    # ---- Subdepartment validation
    def test_create_subdepartment(self, admin_client, department):
        res = admin_client.post(self.url, {
            "name": "Sub TI",
            "department_type": "sub",
            "parent_department": department.id,
        })
        assert res.status_code == 201
        assert res.data["parent_department"] == department.id
