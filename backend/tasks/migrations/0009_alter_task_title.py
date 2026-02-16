from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0008_alter_subtask_title"),
    ]

    operations = [
        migrations.AlterField(
            model_name="task",
            name="title",
            field=models.TextField(verbose_name="Título"),
        ),
    ]

