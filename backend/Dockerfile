# Usa uma imagem oficial leve e otimizada
FROM python:3.12-slim

# Variáveis de ambiente para otimizar execução do Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Atualiza dependências do sistema e instala dependências necessárias
RUN apt-get update && \
    apt-get install -y gcc libpq-dev netcat-openbsd \
    libjpeg-dev zlib1g-dev libmagic-dev dos2unix && \
    apt-get clean

# Define o diretório de trabalho
WORKDIR /app

# Copia o arquivo de dependências primeiro (melhor aproveitamento de cache)
COPY requirements.txt .

# Instala dependências do Python
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia o restante da aplicação para o container
COPY . .

# Copia e dá permissão ao script de entrada para produção
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

# Define o entrypoint de produção
ENTRYPOINT ["/entrypoint.sh"]

# Comando padrão (pode ser sobrescrito pelo Docker Compose)
CMD ["gunicorn", "app.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "5", "--threads", "2", "--timeout", "120"]
