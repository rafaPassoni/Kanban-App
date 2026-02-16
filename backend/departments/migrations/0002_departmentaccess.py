from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('departments', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DepartmentAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_accesses', to='departments.department', verbose_name='Setor')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='department_accesses', to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Acesso por Setor',
                'verbose_name_plural': 'Acessos por Setor',
            },
        ),
        migrations.AddConstraint(
            model_name='departmentaccess',
            constraint=models.UniqueConstraint(fields=('user', 'department'), name='unique_department_access'),
        ),
    ]
