"""
Management command para criar os grupos e suas permissoes.
Execute com: python manage.py setup_permissions
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from authentication.permissions import GROUP_PERMISSIONS


class Command(BaseCommand):
    help = 'Cria os grupos de usuários e atribui as permissões correspondentes'

    def handle(self, *args, **options):
        """Execute o comando para criar grupos e permissoes."""
        self.stdout.write(self.style.SUCCESS('Iniciando setup de permissões...'))
        
        created_groups = []
        updated_groups = []
        
        for group_name, permissions_list in GROUP_PERMISSIONS.items():
            # Cria ou obtem o grupo
            group, created = Group.objects.get_or_create(name=group_name)
            
            if created:
                created_groups.append(group_name)
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Grupo criado: {group_name}')
                )
            else:
                updated_groups.append(group_name)
                self.stdout.write(
                    self.style.WARNING(f'↻ Grupo já existia: {group_name}')
                )
            
            # Limpa permissoes antigas do grupo
            group.permissions.clear()
            
            # Adiciona as novas permissoes
            for app_label, model_name, perm_type in permissions_list:
                try:
                    # Constroi o codename da permissao
                    permission_codename = f"{perm_type}_{model_name}"
                    
                    # Obtem o tipo de conteudo do modelo
                    content_type = ContentType.objects.get(
                        app_label=app_label,
                        model=model_name
                    )
                    
                    # Obtem a permissao
                    permission = Permission.objects.get(
                        content_type=content_type,
                        codename=permission_codename
                    )
                    
                    # Adiciona ao grupo
                    group.permissions.add(permission)
                    
                except ContentType.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ✗ Content type não encontrado: '
                            f'{app_label}.{model_name}'
                        )
                    )
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ✗ Permissão não encontrada: '
                            f'{app_label}.{permission_codename}'
                        )
                    )
            
            # Mostra quantidade de permissoes atribuidas
            perm_count = group.permissions.count()
            self.stdout.write(
                self.style.SUCCESS(f'  → {perm_count} permissões atribuídas')
            )
        
        # Resumo final
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('Setup de permissões concluído!'))
        self.stdout.write(self.style.SUCCESS(f'Grupos criados: {len(created_groups)}'))
        self.stdout.write(self.style.SUCCESS(f'Grupos atualizados: {len(updated_groups)}'))
        self.stdout.write(self.style.SUCCESS(f'Total de grupos: {Group.objects.count()}'))
        self.stdout.write(self.style.SUCCESS('='*50))
