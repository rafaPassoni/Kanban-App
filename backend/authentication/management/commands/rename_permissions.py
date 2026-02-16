"""
Renomeia permissoes no Django Admin para incluir modulo, rota e acao.

Padrao:
    "<Modulo> | <rota> | Can add <Modelo>"
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


ACTION_LABELS = {
    "add": "Can add",
    "change": "Can change",
    "delete": "Can delete",
    "view": "Can view",
}

PERMISSION_LABELS = {
    ("projectsmanager", "project"): ("Projetos", "/projects", "Projeto"),
    ("collaborators", "collaborator"): ("Colaboradores", "/collaborators", "Colaborador"),
    ("departments", "department"): ("Setores", "/departments", "Setor"),
    ("departments", "departmentaccess"): ("Setores", "/departments/access", "Acesso a Setor"),
    ("tasks", "task"): ("Kanban", "/kanban", "Tarefa"),
    ("tasks", "subtask"): ("Kanban", "/kanban", "Subtarefa"),
    ("auth", "user"): ("Autenticação", "/admin/auth/user", "Usuário"),
    ("auth", "group"): ("Autenticação", "/admin/auth/group", "Grupo"),
    ("auth", "permission"): ("Autenticação", "/admin/auth/permission", "Permissão"),
    ("admin", "logentry"): ("Administração", "/admin/admin/logentry", "Registro de Log"),
    ("sessions", "session"): ("Sessões", "/admin/sessions/session", "Sessão"),
    ("token_blacklist", "blacklistedtoken"): ("Tokens JWT", "/admin/token_blacklist/blacklistedtoken", "Token Bloqueado"),
    ("token_blacklist", "outstandingtoken"): ("Tokens JWT", "/admin/token_blacklist/outstandingtoken", "Token Pendente"),
    ("contenttypes", "contenttype"): ("Tipos de Conteúdo", "/admin/contenttypes/contenttype", "Tipo de Conteúdo"),
}


class Command(BaseCommand):
    help = "Renomeia permissões para o padrão '<Módulo> | <rota> | Can add <Modelo>'"

    def handle(self, *args, **options):
        updated = 0
        skipped = 0

        for permission in Permission.objects.select_related("content_type").all():
            # Codenames padrao seguem o formato "<acao>_<modelo>".
            codename = permission.codename or ""
            parts = codename.split("_", 1)
            if len(parts) != 2:
                skipped += 1
                continue

            action = parts[0]
            action_label = ACTION_LABELS.get(action)
            if not action_label:
                skipped += 1
                continue

            content_type = permission.content_type
            label_key = (content_type.app_label, content_type.model)
            label = PERMISSION_LABELS.get(label_key)
            if not label:
                # Permissao sem mapeamento explicito e mantida como esta.
                skipped += 1
                continue

            module_label, route, model_label = label
            desired_name = f"{module_label} | {route} | {action_label} {model_label}"

            if permission.name != desired_name:
                permission.name = desired_name
                permission.save(update_fields=["name"])
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Permissões atualizadas: {updated} | Ignoradas: {skipped}")
        )
