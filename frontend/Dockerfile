# Usar Node.js como base
FROM node:18

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências e instalar
COPY package.json package-lock.json /app/
RUN npm install

# Copiar todo o código do frontend
COPY . /app/

# Expor a porta do Next.js
EXPOSE 3000

# Rodar o servidor de desenvolvimento do Next.js
CMD ["npm", "run", "start"]
