# Kanban Qualidade

Sistema interno de gestão de tarefas em formato Kanban, desenvolvido para o setor de TI/Qualidade.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 5.2 + Django REST Framework 3.16 |
| Autenticação | SimpleJWT (access + refresh token) |
| Banco de dados | PostgreSQL 15 (dev: SQLite) |
| Frontend | Next.js 15 + React 19 + Tailwind CSS v4 |
| Infra | Docker Compose + Nginx |

---

## Estrutura do projeto

```
Kanban-App/
├── backend/              # API Django
│   ├── app/              # Settings, URLs, WSGI
│   ├── authentication/   # Login, logout, refresh, /me
│   ├── tasks/            # Tarefas e subtarefas (Kanban)
│   ├── projectsmanager/  # Projetos internos
│   ├── collaborators/    # Colaboradores
│   ├── departments/      # Setores
│   ├── entrypoint.sh     # Migrate + superuser + collectstatic
│   ├── gunicorn.conf.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # Next.js
│   ├── src/app/
│   │   ├── kanban/       # Quadro Kanban principal
│   │   ├── projetos/     # Gestão de projetos, responsáveis e setores
│   │   └── login/        # Autenticação
│   ├── Dockerfile
│   └── package.json
├── nginx/                # Proxy reverso (produção)
│   ├── nginx.conf
│   └── Dockerfile
├── scripts/
│   └── backup-db.sh      # Backup PostgreSQL com rotação de 7 dias
├── docker-compose.yml        # Desenvolvimento
├── docker-compose.prod.yml   # Produção
└── .github/workflows/ci.yml  # CI/CD
```

---

## Rodando em desenvolvimento

### Pré-requisitos

- Docker e Docker Compose instalados

### 1. Configurar variáveis de ambiente

```bash
cp backend/.env-example backend/.env
# Edite backend/.env com seus valores locais
```

Crie também o `.env` na raiz (credenciais do container PostgreSQL):

```
DB_NAME=kanban_db
DB_USER=kanban_user
DB_PASSWORD=sua_senha_aqui
```

> Os valores de `DB_NAME`, `DB_USER` e `DB_PASSWORD` devem ser iguais nos dois arquivos.

### 2. Subir os containers

```bash
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3022 |
| Backend API | http://localhost:8022/api/v1/ |
| Django Admin | http://localhost:8022/admin/ |

O superusuário é criado automaticamente na primeira inicialização com as credenciais definidas em `backend/.env` (`DJANGO_ADMIN_USER`, `DJANGO_ADMIN_EMAIL`, `DJANGO_ADMIN_PASSWORD`).

---

## Rodando em produção

### 1. Configurar variáveis de ambiente

```bash
cp backend/.env-example backend/.env
# Edite com valores de produção (DEBUG=False, senhas fortes, domínio correto)
```

Gere uma SECRET_KEY segura:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Crie o `.env` na raiz com as mesmas credenciais de banco do `backend/.env`.

### 2. Subir em produção

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

O Nginx sobe na porta **80** como único ponto de entrada. Backend e frontend não ficam expostos diretamente.

---

## Variáveis de ambiente

Todas as variáveis são documentadas em [`backend/.env-example`](backend/.env-example).

| Variável | Descrição |
|----------|-----------|
| `SECRET_KEY` | Chave secreta do Django (obrigatória) |
| `DEBUG` | `True` em dev, `False` em produção |
| `ALLOWED_HOSTS` | IPs/domínios permitidos (separados por vírgula) |
| `DB_NAME` | Nome do banco PostgreSQL |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_HOST` | Host do banco (padrão: `db`) |
| `CORS_ALLOWED_ORIGINS` | URL do frontend (ex: `http://192.168.1.123`) |
| `CSRF_TRUSTED_ORIGINS` | Mesma URL do CORS |
| `DJANGO_ADMIN_USER` | Usuário do painel admin |
| `DJANGO_ADMIN_EMAIL` | E-mail do admin |
| `DJANGO_ADMIN_PASSWORD` | Senha do admin |

Para o frontend, crie `frontend/.env`:

```
NEXT_PUBLIC_URL=http://localhost:8022
```

Em produção, aponte para o domínio/IP do servidor (sem porta, pois o Nginx resolve).

---

## Testes

### Backend

```bash
cd backend
pip install -r requirements-dev.txt
pytest -v
```

### Frontend

```bash
cd frontend
npm ci
npx tsc --noEmit   # verificação de tipos
npx vitest run     # testes unitários
```

---

## CI/CD

O pipeline roda automaticamente a cada push ou pull request para `master`:

| Job | O que faz |
|-----|-----------|
| `Backend Tests` | pytest com PostgreSQL real |
| `Frontend Checks` | TypeScript check + vitest |
| `Docker Build Test` | Valida que os Dockerfiles constroem sem erros |

---

## Páginas

| Rota | Descrição | Autenticação |
|------|-----------|-------------|
| `/login` | Formulário de login | Pública |
| `/kanban` | Quadro Kanban principal | Obrigatória |
| `/kanban/tv` | Modo TV para telões | Pública |
| `/projetos` | Gestão de projetos, responsáveis e setores | Obrigatória |

---

## Backup do banco

Para agendar backup diário automático na VPS, adicione ao cron:

```bash
0 2 * * * /caminho/para/scripts/backup-db.sh
```

O script mantém os últimos 7 dias de backups comprimidos em `.sql.gz`.
