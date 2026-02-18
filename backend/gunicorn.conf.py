"""Configuracao do Gunicorn para producao."""

bind = "0.0.0.0:8000"
workers = 4
worker_class = "gevent"
timeout = 120
accesslog = "-"
errorlog = "-"
