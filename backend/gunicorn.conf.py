"""Configuracao do Gunicorn para producao."""

bind = "0.0.0.0:8000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
timeout = 120
max_requests = 1000
max_requests_jitter = 100
graceful_timeout = 30
accesslog = "-"
errorlog = "-"
