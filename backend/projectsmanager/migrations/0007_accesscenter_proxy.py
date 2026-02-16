from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("projectsmanager", "0006_project_is_online"),
    ]

    operations = [
        migrations.CreateModel(
            name="AccessCenter",
            fields=[],
            options={
                "verbose_name": "Central de Acessos",
                "verbose_name_plural": "Central de Acessos",
                "proxy": True,
                "default_permissions": ("view",),
            },
            bases=("projectsmanager.project",),
        ),
    ]
