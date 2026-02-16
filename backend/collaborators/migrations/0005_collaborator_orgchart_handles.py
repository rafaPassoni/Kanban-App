from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collaborators', '0004_collaborator_orgchart_position'),
    ]

    operations = [
        migrations.AddField(
            model_name='collaborator',
            name='orgchart_source_handle',
            field=models.CharField(blank=True, max_length=32, null=True, verbose_name='Orgchart source handle'),
        ),
        migrations.AddField(
            model_name='collaborator',
            name='orgchart_target_handle',
            field=models.CharField(blank=True, max_length=32, null=True, verbose_name='Orgchart target handle'),
        ),
    ]
