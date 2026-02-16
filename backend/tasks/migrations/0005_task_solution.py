from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0004_task_completed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="solution",
            field=models.TextField(blank=True, null=True, verbose_name="Solução"),
        ),
    ]
