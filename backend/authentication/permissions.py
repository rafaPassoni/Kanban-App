"""
Definicoes de permissoes e grupos para a aplicacao Kanban.
Sistema de controle de acesso baseado em grupos.
"""

from enum import Enum
from typing import Dict, List, Tuple


class PermissionGroup(Enum):
    """Enum com os grupos de usuarios da aplicacao."""

    ADMIN_COMPLETO = "Administrador Completo"
    GERENCIADOR_PROJETOS = "Gerenciador de Projetos"
    GERENCIADOR_KANBAN = "Gerenciador de Kanban"
    VISUALIZADOR_COMPLETO = "Visualizador Completo"
    VISUALIZADOR_PROJETOS = "Visualizador de Projetos"
    VISUALIZADOR_KANBAN = "Visualizador de Kanban"
    GRUPO = "GRUPO"


# Mapa de permissoes para cada grupo
# Formato: {grupo: [(app_label, model, tipo_permissao), ...]}
# Tipos de permissao: 'add', 'change', 'delete', 'view'
GROUP_PERMISSIONS: Dict[str, List[Tuple[str, str, str]]] = {
    # ADMIN COMPLETO - Acesso total a tudo
    "Administrador Completo": [
        # Projetos
        ("projectsmanager", "project", "add"),
        ("projectsmanager", "project", "change"),
        ("projectsmanager", "project", "delete"),
        ("projectsmanager", "project", "view"),
        # Tarefas (Kanban)
        ("tasks", "task", "add"),
        ("tasks", "task", "change"),
        ("tasks", "task", "delete"),
        ("tasks", "task", "view"),
        ("tasks", "subtask", "add"),
        ("tasks", "subtask", "change"),
        ("tasks", "subtask", "delete"),
        ("tasks", "subtask", "view"),
    ],
    # GERENCIADOR DE PROJETOS - Gerencia projetos (CRUD)
    "Gerenciador de Projetos": [
        ("projectsmanager", "project", "add"),
        ("projectsmanager", "project", "change"),
        ("projectsmanager", "project", "delete"),
        ("projectsmanager", "project", "view"),
        # Apenas visualizar kanban
        ("tasks", "task", "view"),
        ("tasks", "subtask", "view"),
    ],
    # GERENCIADOR DE KANBAN - Gerencia tarefas (CRUD)
    "Gerenciador de Kanban": [
        ("tasks", "task", "add"),
        ("tasks", "task", "change"),
        ("tasks", "task", "delete"),
        ("tasks", "task", "view"),
        ("tasks", "subtask", "add"),
        ("tasks", "subtask", "change"),
        ("tasks", "subtask", "delete"),
        ("tasks", "subtask", "view"),
        # Apenas visualizar projetos
        ("projectsmanager", "project", "view"),
    ],
    # VISUALIZADOR COMPLETO - Apenas leitura em tudo
    "Visualizador Completo": [
        ("projectsmanager", "project", "view"),
        ("tasks", "task", "view"),
        ("tasks", "subtask", "view"),
    ],
    # VISUALIZADOR DE PROJETOS - Apenas visualiza projetos
    "Visualizador de Projetos": [
        ("projectsmanager", "project", "view"),
        ("tasks", "task", "view"),
        ("tasks", "subtask", "view"),
    ],
    # VISUALIZADOR DE KANBAN - Apenas visualiza kanban
    "Visualizador de Kanban": [
        ("tasks", "task", "view"),
        ("tasks", "subtask", "view"),
        ("projectsmanager", "project", "view"),
    ],
    # GRUPO - Apenas para organizacao, sem permissoes especificas
    "GRUPO": [],
}


def get_group_permissions(group_name: str) -> List[Tuple[str, str, str]]:
    """
    Retorna a lista de permissoes para um grupo especifico.

    Args:
        group_name: Nome do grupo

    Returns:
        Lista de tuplas (app_label, model, tipo_permissao)
    """
    return GROUP_PERMISSIONS.get(group_name, [])


def get_all_groups() -> Dict[str, List[Tuple[str, str, str]]]:
    """Retorna todos os grupos e suas permissoes."""
    return GROUP_PERMISSIONS
