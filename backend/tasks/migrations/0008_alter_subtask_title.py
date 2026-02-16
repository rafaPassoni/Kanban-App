from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0007_task_multi_assignments"),
    ]

    operations = [
        migrations.AlterField(
            model_name="subtask",
            name="title",
            field=models.TextField(verbose_name="Título"),
        ),
    ]

