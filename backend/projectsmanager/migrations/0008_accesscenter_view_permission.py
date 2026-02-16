from django.db import migrations


def ensure_accesscenter_view_permission(apps, schema_editor):
    AccessCenter = apps.get_model("projectsmanager", "AccessCenter")
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")

    content_type = ContentType.objects.get_for_model(AccessCenter, for_concrete_model=False)
    Permission.objects.get_or_create(
        content_type=content_type,
        codename="view_accesscenter",
        defaults={"name": "Can view Central de Acessos"},
    )


class Migration(migrations.Migration):
    dependencies = [
        ("projectsmanager", "0007_accesscenter_proxy"),
    ]

    operations = [
        migrations.RunPython(ensure_accesscenter_view_permission, migrations.RunPython.noop),
    ]
