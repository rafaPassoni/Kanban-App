from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0002_alter_task_order_alter_task_priority_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Subtask",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255, verbose_name="Título")),
                ("is_done", models.BooleanField(db_index=True, default=False, verbose_name="Concluída")),
                ("order", models.IntegerField(db_index=True, default=0, verbose_name="Ordem")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criada Em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizada Em")),
                (
                    "task",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subtasks",
                        to="tasks.task",
                        verbose_name="Task",
                    ),
                ),
            ],
            options={
                "verbose_name": "Subtask",
                "verbose_name_plural": "Subtasks",
                "ordering": ["order", "created_at"],
            },
        ),
    ]
