"""
Configuracao WSGI para o projeto app.

Expoe o callable WSGI como uma variavel de modulo chamada ``application``.

Para mais informacoes sobre este arquivo, consulte
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

application = get_wsgi_application()
