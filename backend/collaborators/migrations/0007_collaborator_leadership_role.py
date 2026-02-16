from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collaborators', '0006_collaborator_managers'),
    ]

    operations = [
        migrations.AddField(
            model_name='collaborator',
            name='leadership_role',
            field=models.CharField(blank=True, max_length=80, null=True, verbose_name='Nivel de Lideranca'),
        ),
    ]
