from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collaborators', '0005_collaborator_orgchart_handles'),
    ]

    operations = [
        migrations.AddField(
            model_name='collaborator',
            name='managers',
            field=models.ManyToManyField(blank=True, related_name='reports', to='collaborators.collaborator', verbose_name='Gestores'),
        ),
    ]
