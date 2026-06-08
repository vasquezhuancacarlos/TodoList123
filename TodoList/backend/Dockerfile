FROM node:20-alpine

# Instalar openssl para generacion de certificados
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Crear directorio de certs y uploads
RUN mkdir -p certs uploads

# Generar certificados auto-firmados al construir la imagen
RUN openssl req -x509 -newkey rsa:4096 \
    -keyout certs/server.key \
    -out certs/server.crt \
    -days 365 -nodes \
    -subj "/C=BO/ST=Cochabamba/L=Cochabamba/O=Dev/OU=Dev/CN=localhost"

EXPOSE 3000 3443

CMD ["node", "server.js"]
