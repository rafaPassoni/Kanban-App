from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collaborators', '0007_collaborator_leadership_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrgchartEdge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_handle', models.CharField(blank=True, max_length=32, null=True, verbose_name='Source handle')),
                ('target_handle', models.CharField(blank=True, max_length=32, null=True, verbose_name='Target handle')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('source', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='orgchart_edges_out', to='collaborators.collaborator', verbose_name='Origem')),
                ('target', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='orgchart_edges_in', to='collaborators.collaborator', verbose_name='Destino')),
            ],
            options={
                'verbose_name': 'Aresta do organograma',
                'verbose_name_plural': 'Arestas do organograma',
            },
        ),
        migrations.AddConstraint(
            model_name='orgchartedge',
            constraint=models.UniqueConstraint(fields=('source', 'target'), name='unique_orgchart_edge'),
        ),
    ]
