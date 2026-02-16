"""Fixtures compartilhadas entre todos os testes do backend."""

import pytest
from django.contrib.auth.models import Group, Permission, User
from rest_framework.test import APIClient

from departments.models import Department
from collaborators.models import Collaborator
from projectsmanager.models import Project
from tasks.models import Task


def _assign_perms(group: Group, perms: list[tuple[str, str, str]]) -> None:
    """Atribui permissoes a um grupo a partir de tuplas (app, model, action)."""
    for app, model, action in perms:
        codename = f"{action}_{model}"
        perm = Permission.objects.filter(
            codename=codename, content_type__app_label=app
        ).first()
        if perm:
            group.permissions.add(perm)


@pytest.fixture
def admin_group(db):
    """Grupo com permissoes completas de CRUD em todos os modelos."""
    group, _ = Group.objects.get_or_create(name="Administrador Completo")
    _assign_perms(group, [
        ("tasks", "task", perm)
        for perm in ("view", "add", "change", "delete")
    ] + [
        ("tasks", "subtask", perm)
        for perm in ("view", "add", "change", "delete")
    ] + [
        ("projectsmanager", "project", perm)
        for perm in ("view", "add", "change", "delete")
    ] + [
        ("collaborators", "collaborator", perm)
        for perm in ("view", "add", "change", "delete")
    ] + [
        ("departments", "department", perm)
        for perm in ("view", "add", "change", "delete")
    ])
    return group


@pytest.fixture
def viewer_group(db):
    """Grupo somente-leitura."""
    group, _ = Group.objects.get_or_create(name="Visualizador Completo")
    _assign_perms(group, [
        ("tasks", "task", "view"),
        ("tasks", "subtask", "view"),
        ("projectsmanager", "project", "view"),
        ("collaborators", "collaborator", "view"),
        ("departments", "department", "view"),
    ])
    return group


@pytest.fixture
def admin_user(db, admin_group):
    """Usuario com permissoes de admin."""
    user = User.objects.create_user(username="admin_test", password="test1234")
    user.groups.add(admin_group)
    return user


@pytest.fixture
def viewer_user(db, viewer_group):
    """Usuario somente-leitura."""
    user = User.objects.create_user(username="viewer_test", password="test1234")
    user.groups.add(viewer_group)
    return user


@pytest.fixture
def nogroup_user(db):
    """Usuario sem nenhum grupo/permissao."""
    return User.objects.create_user(username="nogroup_test", password="test1234")


@pytest.fixture
def admin_client(admin_user):
    """APIClient autenticado como admin."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def viewer_client(viewer_user):
    """APIClient autenticado como viewer."""
    client = APIClient()
    client.force_authenticate(user=viewer_user)
    return client


@pytest.fixture
def nogroup_client(nogroup_user):
    """APIClient autenticado sem permissoes."""
    client = APIClient()
    client.force_authenticate(user=nogroup_user)
    return client


@pytest.fixture
def anon_client():
    """APIClient sem autenticacao."""
    return APIClient()


@pytest.fixture
def department(db):
    return Department.objects.create(name="TI", department_type="main")


@pytest.fixture
def collaborator(db, department):
    return Collaborator.objects.create(
        name="Joao Silva", email="joao@test.com", position="Dev", department=department
    )


@pytest.fixture
def project(db):
    return Project.objects.create(name="Projeto Alpha", description="Descricao teste")


@pytest.fixture
def task(db, project, collaborator):
    return Task.objects.create(
        title="Tarefa Teste",
        status="TODO",
        priority="MEDIUM",
        project=project,
        responsavel=collaborator,
    )
