"""Fixtures compartilhadas entre todos os testes do backend."""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from departments.models import Department
from collaborators.models import Collaborator
from projectsmanager.models import Project
from tasks.models import Task


@pytest.fixture
def admin_user(db):
    """Usuario autenticado (admin/superuser)."""
    return User.objects.create_superuser(username="admin_test", password="test1234")


@pytest.fixture
def regular_user(db):
    """Usuario autenticado comum (sem privilegios especiais)."""
    return User.objects.create_user(username="regular_test", password="test1234")


@pytest.fixture
def admin_client(admin_user):
    """APIClient autenticado como admin."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def auth_client(regular_user):
    """APIClient autenticado como usuario comum."""
    client = APIClient()
    client.force_authenticate(user=regular_user)
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
