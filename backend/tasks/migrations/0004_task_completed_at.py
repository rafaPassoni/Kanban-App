from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0003_subtask"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="Concluida Em"),
        ),
    ]
