from django.db import migrations, models


def move_single_to_many(apps, schema_editor):
    Task = apps.get_model("tasks", "Task")
    for task in Task.objects.all():
        if task.assigned_to_id:
            task.assigned_to_multi.add(task.assigned_to_id)
        if task.department_id:
            task.department_multi.add(task.department_id)


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0006_alter_subtask_options_alter_task_options_and_more"),
        ("collaborators", "0005_collaborator_orgchart_handles"),
        ("departments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="assigned_to_multi",
            field=models.ManyToManyField(
                blank=True,
                related_name="assigned_tasks",
                to="collaborators.collaborator",
                verbose_name="Responsável",
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="department_multi",
            field=models.ManyToManyField(
                blank=True,
                related_name="department_tasks",
                to="departments.department",
                verbose_name="Setor",
            ),
        ),
        migrations.RunPython(move_single_to_many, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="task",
            name="assigned_to",
        ),
        migrations.RemoveField(
            model_name="task",
            name="department",
        ),
        migrations.RenameField(
            model_name="task",
            old_name="assigned_to_multi",
            new_name="assigned_to",
        ),
        migrations.RenameField(
            model_name="task",
            old_name="department_multi",
            new_name="department",
        ),
    ]
