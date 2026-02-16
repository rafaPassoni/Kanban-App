from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projectsmanager", "0008_accesscenter_view_permission"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="status",
            field=models.CharField(
                blank=True,
                max_length=255,
                null=True,
                verbose_name="Status",
            ),
        ),
    ]

