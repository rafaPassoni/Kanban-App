"""Testes de API para o app tasks (Task e Subtask)."""

import pytest
from django.urls import reverse
from tasks.models import Subtask, Task


# ========================
# Task CRUD
# ========================
@pytest.mark.django_db
class TestTaskAPI:
    """Testes do endpoint /api/v1/tasks/."""

    url = "/api/v1/tasks/"

    def detail_url(self, pk):
        return f"{self.url}{pk}/"

    # ---- List
    def test_list_authenticated(self, admin_client, task):
        res = admin_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 1

    def test_list_anonymous_forbidden(self, anon_client):
        res = anon_client.get(self.url)
        assert res.status_code == 401

    # ---- Create
    def test_create_as_admin(self, admin_client, project):
        res = admin_client.post(self.url, {
            "title": "Nova tarefa",
            "status": "TODO",
            "priority": "HIGH",
            "project": project.id,
        })
        assert res.status_code == 201
        assert res.data["title"] == "Nova tarefa"

    def test_create_as_viewer_forbidden(self, viewer_client):
        res = viewer_client.post(self.url, {"title": "Nao deveria", "status": "TODO"})
        assert res.status_code == 403

    def test_create_no_perms_forbidden(self, nogroup_client):
        res = nogroup_client.post(self.url, {"title": "Nao deveria", "status": "TODO"})
        assert res.status_code == 403

    # ---- Update
    def test_update_as_admin(self, admin_client, task):
        res = admin_client.patch(self.detail_url(task.id), {"title": "Editada"})
        assert res.status_code == 200
        assert res.data["title"] == "Editada"

    def test_update_as_viewer_forbidden(self, viewer_client, task):
        res = viewer_client.patch(self.detail_url(task.id), {"title": "Nope"})
        assert res.status_code == 403

    # ---- Delete
    def test_delete_as_admin(self, admin_client, task):
        res = admin_client.delete(self.detail_url(task.id))
        assert res.status_code == 204
        assert not Task.objects.filter(id=task.id).exists()

    def test_delete_as_viewer_forbidden(self, viewer_client, task):
        res = viewer_client.delete(self.detail_url(task.id))
        assert res.status_code == 403

    # ---- Filters
    def test_filter_by_project(self, admin_client, task):
        res = admin_client.get(self.url, {"project": task.project_id})
        assert res.status_code == 200
        assert all(t["project"] == task.project_id for t in res.data["results"])

    def test_filter_by_status(self, admin_client, task):
        res = admin_client.get(self.url, {"status": "TODO"})
        assert res.status_code == 200
        assert all(t["status"] == "TODO" for t in res.data["results"])


# ========================
# Subtask CRUD
# ========================
@pytest.mark.django_db
class TestSubtaskAPI:
    """Testes do endpoint /api/v1/subtasks/."""

    url = "/api/v1/subtasks/"

    def detail_url(self, pk):
        return f"{self.url}{pk}/"

    # ---- Create
    def test_create_subtask(self, admin_client, task):
        res = admin_client.post(self.url, {"task": task.id, "title": "Sub 1"})
        assert res.status_code == 201
        assert res.data["title"] == "Sub 1"
        assert res.data["is_done"] is False

    def test_create_subtask_viewer_forbidden(self, viewer_client, task):
        res = viewer_client.post(self.url, {"task": task.id, "title": "Sub viewer"})
        assert res.status_code == 403

    # ---- Update
    def test_toggle_subtask_done(self, admin_client, task):
        sub = Subtask.objects.create(task=task, title="Sub toggle")
        res = admin_client.patch(self.detail_url(sub.id), {"is_done": True})
        assert res.status_code == 200
        assert res.data["is_done"] is True

    # ---- Delete
    def test_delete_subtask(self, admin_client, task):
        sub = Subtask.objects.create(task=task, title="Sub deletar")
        res = admin_client.delete(self.detail_url(sub.id))
        assert res.status_code == 204
        assert not Subtask.objects.filter(id=sub.id).exists()

    # ---- List
    def test_list_subtasks(self, admin_client, task):
        Subtask.objects.create(task=task, title="A")
        Subtask.objects.create(task=task, title="B")
        res = admin_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 2


# ========================
# Public Tasks (read-only)
# ========================
@pytest.mark.django_db
class TestPublicTaskAPI:
    """Testes do endpoint /api/v1/tasks-public/ (sem autenticacao)."""

    url = "/api/v1/tasks-public/"

    def test_list_public(self, anon_client, task):
        res = anon_client.get(self.url)
        assert res.status_code == 200
        assert res.data["count"] >= 1

    def test_public_readonly(self, anon_client, task):
        res = anon_client.post(self.url, {"title": "Hack"})
        assert res.status_code in (403, 405)
