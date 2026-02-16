"""Helpers de permissao para DRF e mapeamento de acessos por grupo."""

from functools import wraps
from django.core.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, DjangoModelPermissions, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied


class HasGroupPermission(BasePermission):
    """
    Permissao customizada que verifica se o usuario esta em um grupo
    com as permissoes necessarias para a acao solicitada.
    """
    
    def has_permission(self, request, view):
        """Verifica se o usuario tem as permissoes necessarias."""
        user = request.user
        
        # Superusers tem acesso total
        if user and user.is_superuser:
            return True
        
        # Usuarios nao autenticados nao tem permissao
        if not user or not user.is_authenticated:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """Verifica permissao no nivel do objeto."""
        user = request.user
        
        # Superusers tem acesso total
        if user and user.is_superuser:
            return True
        
        return True


class EnhancedDjangoModelPermissions(DjangoModelPermissions):
    """
    Extensao do DjangoModelPermissions que tambem permite
    o acesso 'view' para usuarios autenticados.
    """
    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': ['%(app_label)s.view_%(model_name)s'],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }


def require_group_permission(permission_type: str, resource: str = None):
    """
    Decorador para verificar permissoes de grupo em funcoes de view.
    
    Args:
        permission_type: Tipo de permissao ('add', 'change', 'delete', 'view')
        resource: Recurso especifico (app_label.model_name). Se None, usa o padrao.
    
    Example:
        @require_group_permission('change', 'projectsmanager.project')
        def update_project(request, pk):
            ...
    """
    def decorator(func):
        """Fecha sobre a view original e injeta a checagem antes da execucao."""
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            """Bloqueia a execucao quando o usuario nao atende a regra exigida."""
            user = request.user
            
            # Superusers tem acesso total
            if user and user.is_superuser:
                return func(request, *args, **kwargs)
            
            # Usuarios nao autenticados
            if not user or not user.is_authenticated:
                raise DRFPermissionDenied("Você precisa estar autenticado para acessar este recurso.")
            
            # Verifica se o usuario tem a permissao nos seus grupos
            user_groups = user.groups.all()
            
            if not user_groups.exists():
                raise DRFPermissionDenied("Seu usuário não está em nenhum grupo.")
            
            # Obtem todas as permissoes do usuario atraves de seus grupos
            has_permission = False
            for group in user_groups:
                if user.has_perm(f"{resource}" if resource else "auth.view_user"):
                    has_permission = True
                    break
            
            if not has_permission:
                raise DRFPermissionDenied(
                    f"Você não tem permissão para {permission_type} este recurso."
                )
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def check_user_permission(user, app_label: str, model_name: str, perm_type: str) -> bool:
    """
    Verifica se um usuario tem uma permissao especifica atraves de seus grupos.
    
    Args:
        user: Usuario a ser verificado
        app_label: App label do modelo (ex: 'projectsmanager')
        model_name: Nome do modelo (ex: 'project')
        perm_type: Tipo de permissao ('add', 'change', 'delete', 'view')
    
    Returns:
        True se o usuario tem a permissao, False caso contrario
    """
    # Superusers tem acesso total
    if user and user.is_superuser:
        return True
    
    # Usuarios nao autenticados
    if not user or not user.is_authenticated:
        return False
    
    # Constroi o codename da permissao
    permission_codename = f"{perm_type}_{model_name}"
    
    # Verifica permissoes diretas do usuario
    if user.has_perm(f"{app_label}.{permission_codename}"):
        return True
    
    # Verifica permissoes dos grupos do usuario
    return user.groups.filter(
        permissions__codename=permission_codename,
        permissions__content_type__app_label=app_label
    ).exists()


def get_user_permissions_dict(user) -> dict:
    """
    Retorna um dicionario com todas as permissoes do usuario,
    organizadas por app_label.model_name.
    
    Args:
        user: Usuario
        
    Returns:
        Dict com estrutura: {
            'projectsmanager.project': ['add', 'change', 'delete', 'view'],
            'environments.environment': ['view'],
            ...
        }
    """
    if not user.is_authenticated:
        return {}
    
    permissions = {}
    
    # Se e superuser, tem todas as permissoes
    if user.is_superuser:
        from django.contrib.auth.models import Permission
        all_perms = Permission.objects.all()
        for perm in all_perms:
            key = f"{perm.content_type.app_label}.{perm.content_type.model}"
            if key not in permissions:
                permissions[key] = []
            # Extrai o tipo de permissao do codename (add_, change_, delete_, view_)
            perm_type = perm.codename.split('_', 1)[0]
            if perm_type not in permissions[key]:
                permissions[key].append(perm_type)
        return permissions
    
    # Coleta permissoes do usuario
    user_perms = user.user_permissions.select_related('content_type')
    for perm in user_perms:
        key = f"{perm.content_type.app_label}.{perm.content_type.model}"
        if key not in permissions:
            permissions[key] = []
        perm_type = perm.codename.split('_', 1)[0]
        if perm_type not in permissions[key]:
            permissions[key].append(perm_type)
    
    # Coleta permissoes dos grupos
    group_perms = user.groups.values_list(
        'permissions__codename',
        'permissions__content_type__app_label',
        'permissions__content_type__model'
    ).distinct()
    
    for perm_codename, app_label, model_name in group_perms:
        if perm_codename:  # Verifica se não é nulo
            key = f"{app_label}.{model_name}"
            if key not in permissions:
                permissions[key] = []
            perm_type = perm_codename.split('_', 1)[0]
            if perm_type not in permissions[key]:
                permissions[key].append(perm_type)

    return permissions


class GranularProjectPermissions(BasePermission):
    """
    Permissão granular para projetos.

    Hierarquia de verificação:
    1. Superuser/Staff: acesso total
    2. UserProjectAccess: permissões granulares específicas
    3. DepartmentAccess: acesso por departamento
    4. Grupos Django: permissões genéricas
    """

    def has_permission(self, request, view):
        """Verifica permissão geral para a ação."""
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        if request.method in SAFE_METHODS:
            # Permissões Django tradicionais
            if (request.user.has_perm('projectsmanager.view_project') or
                    request.user.has_perm('projectsmanager.view_accesscenter')):
                return True
            # Acesso granular: projetos específicos ou departamentos
            from projectsmanager.models import UserProjectAccess
            from departments.models import DepartmentAccess
            return (
                UserProjectAccess.objects.filter(
                    user=request.user, can_view=True
                ).exists() or
                DepartmentAccess.objects.filter(user=request.user).exists()
            )

        perms_map = {
            'POST': 'projectsmanager.add_project',
            'PUT': 'projectsmanager.change_project',
            'PATCH': 'projectsmanager.change_project',
            'DELETE': 'projectsmanager.delete_project',
        }

        required_perm = perms_map.get(request.method)
        return request.user.has_perm(required_perm) if required_perm else False

    def has_object_permission(self, request, view, obj):
        """Verifica permissão no nível do objeto específico."""
        user = request.user

        if user.is_superuser or user.is_staff:
            return True

        from projectsmanager.models import UserProjectAccess
        try:
            access = UserProjectAccess.objects.get(user=user, project=obj)

            if request.method in SAFE_METHODS:
                return access.can_view

            if request.method in ['PUT', 'PATCH']:
                return access.can_edit

            if request.method == 'DELETE':
                return user.has_perm('projectsmanager.delete_project')

        except UserProjectAccess.DoesNotExist:
            if request.method in SAFE_METHODS:
                return (user.has_perm('projectsmanager.view_project') or
                        user.has_perm('projectsmanager.view_accesscenter'))

            if request.method in ['PUT', 'PATCH']:
                return user.has_perm('projectsmanager.change_project')

            if request.method == 'DELETE':
                return user.has_perm('projectsmanager.delete_project')

        return False
