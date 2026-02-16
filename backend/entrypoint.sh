#!/bin/bash
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "⏳ Aguardando inicialização do banco de dados em $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "⏳ Esperando PostgreSQL em $DB_HOST:$DB_PORT..."
  sleep 1
done

echo "🔄 Executando migrate..."
python manage.py migrate --noinput

echo "🔐 Verificando superusuário..."
python manage.py shell << 'END'
from django.contrib.auth import get_user_model
import os
User = get_user_model()
username = os.getenv('DJANGO_ADMIN_USER', 'admin')
email = os.getenv('DJANGO_ADMIN_EMAIL', 'admin@example.com')
password = os.getenv('DJANGO_ADMIN_PASSWORD', 'admin')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"✅ Superusuário criado: {username}")
else:
    print("ℹ️ Superusuário já existe.")
END

echo "📁 Executando collectstatic..."
python manage.py collectstatic --noinput

echo "🚀 Iniciando aplicação..."
exec "$@"
