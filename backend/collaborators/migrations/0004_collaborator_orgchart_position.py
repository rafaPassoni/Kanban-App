from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("collaborators", "0003_alter_collaborator_hierarchy_order_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="collaborator",
            name="orgchart_x",
            field=models.IntegerField(blank=True, null=True, verbose_name="Posição X no organograma"),
        ),
        migrations.AddField(
            model_name="collaborator",
            name="orgchart_y",
            field=models.IntegerField(blank=True, null=True, verbose_name="Posição Y no organograma"),
        ),
    ]
