"""
Configuracao ASGI para o projeto app.

Expoe o callable ASGI como uma variavel de modulo chamada ``application``.

Para mais informacoes sobre este arquivo, consulte
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

application = get_asgi_application()
