# Usa uma imagem oficial leve e otimizada
FROM python:3.12-slim

# Variaveis de ambiente para otimizar execucao do Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Atualiza dependencias do sistema e instala dependencias necessarias
RUN apt-get update && \
    apt-get install -y gcc libpq-dev netcat-openbsd \
    libjpeg-dev zlib1g-dev libmagic-dev dos2unix && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Define o diretorio de trabalho
WORKDIR /app

# Copia o arquivo de dependencias primeiro (melhor aproveitamento de cache)
COPY requirements.txt .

# Instala dependencias do Python
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia o restante da aplicacao para o container
COPY . .

# Copia e da permissao ao script de entrada para producao
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

# Cria usuario nao-root para seguranca
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Define o entrypoint de producao
ENTRYPOINT ["/entrypoint.sh"]

# Comando padrao (usa gunicorn.conf.py para configuracao centralizada)
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app.wsgi:application"]
