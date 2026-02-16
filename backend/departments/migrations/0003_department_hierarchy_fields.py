from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("departments", "0002_departmentaccess"),
    ]

    operations = [
        migrations.AddField(
            model_name="department",
            name="department_type",
            field=models.CharField(
                choices=[("main", "Setor principal"), ("sub", "Subsetor")],
                default="main",
                max_length=10,
                verbose_name="Tipo",
            ),
        ),
        migrations.AddField(
            model_name="department",
            name="parent_department",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="subdepartments",
                to="departments.department",
                verbose_name="Setor principal",
            ),
        ),
    ]
