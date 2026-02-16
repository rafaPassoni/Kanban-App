from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("departments", "0003_department_hierarchy_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="department",
            name="name",
            field=models.CharField(max_length=100, verbose_name="Nome"),
        ),
    ]
