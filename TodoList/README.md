# TodoList HTTPS — Full Stack (React + Node.js + MongoDB)

Aplicación de lista de tareas con autenticación JWT, soporte de archivos (drive) y comunicación **100% HTTPS**. Frontend en React (Vite), backend en Express, base de datos MongoDB.

---

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
4. [Opción A — Despliegue local (sin Docker)](#opción-a--despliegue-local-sin-docker)
5. [Opción B — Despliegue con Docker Compose](#opción-b--despliegue-con-docker-compose)
6. [Base de datos semilla (carga por lotes)](#base-de-datos-semilla-carga-por-lotes)
7. [Endpoints principales de la API](#endpoints-principales-de-la-api)
8. [Credenciales de prueba](#credenciales-de-prueba)
9. [Notas de seguridad](#notas-de-seguridad)

---

## Requisitos previos

| Herramienta | Versión mínima | Necesaria para |
|-------------|---------------|----------------|
| Node.js | 20 LTS | Opción A |
| npm | 9+ | Opción A |
| OpenSSL | cualquiera | Opción A (certificados SSL) |
| MongoDB | 7 | Opción A (local) |
| mongosh | cualquiera | Carga manual de semilla |
| Docker Desktop / Engine | 24+ | Opción B |
| Docker Compose | v2 (`docker compose`) | Opción B |

---

## Estructura del proyecto

```
todolist-https/
├── backend/
│   ├── certs/              # Certificados SSL (generados localmente, NO versionar)
│   ├── config/db.js        # Conexión a MongoDB
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/         # Verificación JWT
│   ├── models/             # Esquemas Mongoose
│   ├── routes/             # Rutas Express
│   ├── scripts/gen-certs.js# Generador de certificados auto-firmados
│   ├── uploads/            # Archivos subidos (NO versionar)
│   ├── .env.example        # ← PLANTILLA de variables de entorno (copia esto)
│   ├── Dockerfile
│   └── server.js
├── frontend/
│   ├── src/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── vite.config.js
├── seed/
│   └── seed.js             # Script de datos de prueba (carga por lotes)
└── docker-compose.yml
```

---

## Configuración de variables de entorno

> ⚠️ **IMPORTANTE:** El archivo `.env` contiene información sensible (contraseñas, secretos).
> **Nunca lo subas al repositorio.** Está incluido en `.gitignore`.
> El archivo `.env.example` es la plantilla pública — úsala como base.

### Paso 1 — Copiar la plantilla

```bash
cp backend/.env.example backend/.env
```

### Paso 2 — Editar `backend/.env` con tus valores reales

Abre `backend/.env` en tu editor y completa cada variable:

```dotenv
# ─── Servidor ───────────────────────────────────────────
PORT=3000           # Puerto HTTP (solo redirige a HTTPS)
HTTPS_PORT=3443     # Puerto HTTPS principal

# ─── Base de datos ──────────────────────────────────────
# Opción 1: MongoDB local
MONGO_URI=mongodb://localhost:27017/todolist

# Opción 2: MongoDB Atlas (descomenta y completa)
# MONGO_URI=mongodb+srv://<USUARIO>:<PASSWORD>@<CLUSTER>.mongodb.net/todolist

# ─── Autenticación JWT ──────────────────────────────────
# Genera un valor seguro con: openssl rand -hex 32
JWT_SECRET=REEMPLAZA_CON_TU_SECRETO_ALEATORIO_MINIMO_32_CHARS

# Tiempo de expiración del token
JWT_EXPIRES_IN=7d
```

### Cómo generar un `JWT_SECRET` seguro

```bash
# Linux / macOS
openssl rand -hex 32

# Node.js (cualquier plataforma)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y reemplaza `REEMPLAZA_CON_TU_SECRETO_ALEATORIO_MINIMO_32_CHARS` en tu `.env`.

---

## Opción A — Despliegue local (sin Docker)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd todolist-https
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
# Edita backend/.env según la sección anterior
```

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Generar los certificados SSL

El servidor requiere certificados TLS para arrancar en HTTPS. Ejecuta desde dentro de `backend/`:

```bash
npm run gen-certs
```

Esto genera `backend/certs/key.pem` y `backend/certs/cert.pem` (auto-firmados, válidos 365 días).

**Alternativa manual con OpenSSL:**

```bash
mkdir -p backend/certs
openssl req -x509 -newkey rsa:4096 \
    -keyout backend/certs/key.pem \
    -out backend/certs/cert.pem \
    -days 365 -nodes \
    -subj "/C=BO/ST=Cochabamba/L=Cochabamba/O=Dev/CN=localhost"
```

### 5. Iniciar MongoDB

**Con MongoDB instalado localmente:**

```bash
mongod --dbpath /data/db
```

**Con Docker (sin Compose):**

```bash
docker run -d -p 27017:27017 --name mongo_local mongo:7
```

Verifica que `MONGO_URI=mongodb://localhost:27017/todolist` esté en tu `backend/.env`.

### 6. Cargar la base de datos semilla

```bash
# Desde la raíz del proyecto
mongosh todolist < seed/seed.js
```

Salida esperada:

```
Semilla cargada: 2 usuarios, 10 tareas.
```

> Para cargar contra Atlas: `mongosh "mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/todolist" < seed/seed.js`

### 7. Iniciar el backend

```bash
# Dentro de backend/
npm start          # producción
# o
npm run dev        # desarrollo con recarga automática (nodemon)
```

Verifica en la terminal:

```
✅  Servidor HTTPS corriendo en https://localhost:3443
↪   Redireccionador HTTP en http://localhost:3000  →  HTTPS
MongoDB conectado correctamente.
```

### 8. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 9. Iniciar el frontend

```bash
npm run dev
```

El frontend estará disponible en `https://localhost:5173`.

> **Aviso del navegador:** Como los certificados son auto-firmados, el navegador mostrará una advertencia.
> En Chrome/Edge: *"Avanzado → Continuar de todas formas"*.
> En Firefox: *"Aceptar el riesgo y continuar"*.

---

## Opción B — Despliegue con Docker Compose

La forma más rápida. Docker levanta MongoDB, el backend y el frontend en un solo comando, y la semilla se carga automáticamente.

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd todolist-https
```

### 2. Configurar el secreto JWT

Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `docker-compose.yml`):

```bash
# Linux / macOS — genera y guarda el secreto en un paso
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Windows (PowerShell)
"JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")" | Out-File .env
```

O créalo manualmente con tu editor:

```dotenv
# .env  (raíz del proyecto)
JWT_SECRET=reemplaza_con_tu_secreto_generado
```

> Si no defines `JWT_SECRET`, Docker usará el valor por defecto `dev_secret_cambia_en_produccion`.
> **No uses ese valor en producción.**

### 3. Construir y levantar los servicios

```bash
docker compose up --build
```

En segundo plano:

```bash
docker compose up --build -d
```

La primera vez, Docker automáticamente:
1. Construye las imágenes del backend y frontend.
2. Levanta MongoDB y ejecuta `seed/seed.js` (carga la base de datos semilla).
3. Genera certificados SSL auto-firmados dentro del contenedor backend.

### 4. Verificar que los servicios estén activos

```bash
docker compose ps
```

Deben aparecer tres servicios en estado `running`:

```
NAME                 STATUS
todolist_mongo       running
todolist_backend     running
todolist_frontend    running
```

### 5. URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend HTTPS | https://localhost:3443 |
| Backend HTTP (redirección) | http://localhost:3000 |

### 6. Ver logs en tiempo real

```bash
docker compose logs -f
```

### 7. Detener los servicios

```bash
docker compose down

# Para eliminar también los volúmenes (borra los datos de la BD):
docker compose down -v
```

---

## Base de datos semilla (carga por lotes)

El archivo `seed/seed.js` contiene datos de prueba listos para cargar en MongoDB de forma masiva (batch).

### ¿Qué inserta la semilla?

- **2 usuarios** con contraseñas hasheadas con bcrypt.
- **10 tareas** distribuidas entre los dos usuarios, con distintos estados (completadas / pendientes).

### Carga automática con Docker Compose

Al ejecutar `docker compose up` por primera vez, el volumen `mongo_data` está vacío y MongoDB ejecuta automáticamente `seed/seed.js`. No se requiere ninguna acción manual.

**Para recargar la semilla desde cero:**

```bash
docker compose down -v   # elimina el volumen (borra todos los datos)
docker compose up --build
```

### Carga manual por lotes (sin Docker)

Con `mongosh` y MongoDB local:

```bash
# Desde la raíz del proyecto
mongosh todolist < seed/seed.js
```

Con MongoDB Atlas:

```bash
mongosh "mongodb+srv://<USUARIO>:<PASSWORD>@<CLUSTER>.mongodb.net/todolist" < seed/seed.js
```

Salida esperada en ambos casos:

```
Semilla cargada: 2 usuarios, 10 tareas.
```

### Verificar la carga

```bash
mongosh todolist --eval "db.users.countDocuments(); db.tasks.countDocuments();"
```

---

## Endpoints principales de la API

Base URL: `https://localhost:3443/api`

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Crear cuenta nueva |
| POST | `/auth/login` | Iniciar sesión, retorna JWT |
| GET | `/auth/me` | Perfil del usuario autenticado |

**Ejemplo — login:**

```bash
curl -k -X POST https://localhost:3443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario1@demo.com","password":"demo1234"}'
```

> Usa `-k` para ignorar la verificación del certificado auto-firmado en desarrollo.

### Tareas (requieren `Authorization: Bearer <token>`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tasks` | Listar tareas (paginado) |
| GET | `/tasks/:id` | Obtener tarea por ID |
| POST | `/tasks` | Crear tarea |
| PUT | `/tasks/:id` | Actualizar tarea completa |
| PATCH | `/tasks/:id/toggle` | Alternar estado completado |
| DELETE | `/tasks/:id` | Eliminar tarea |

### Drive / Archivos (requieren `Authorization: Bearer <token>`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/drive/upload` | Subir archivo |
| GET | `/drive` | Listar archivos del usuario |
| DELETE | `/drive/:id` | Eliminar archivo |

---

## Credenciales de prueba

Creadas automáticamente por `seed/seed.js`:

| Nombre | Email | Contraseña |
|--------|-------|------------|
| Ana Demo | usuario1@demo.com | demo1234 |
| Carlos Demo | usuario2@demo.com | demo1234 |
 
si no da esos usuarios predefinidos registre otros y asi podra acceder con 
normalidad.

> ⚠️ Usa estas credenciales **solo en entornos de desarrollo y prueba**. Nunca en producción.

---

## Notas de seguridad

- **No versiones** `.env`, `certs/*.pem`, `certs/*.key`, `certs/*.crt` ni la carpeta `uploads/`. Todos están en `.gitignore`.
- El archivo `.env.example` es la plantilla pública — contiene solo nombres de variables y valores de ejemplo, **nunca secretos reales**.
- Los certificados auto-firmados son **exclusivos para desarrollo**. Para producción usa certificados de una CA reconocida (por ejemplo, [Let's Encrypt](https://letsencrypt.org/) con Certbot).
- Genera siempre un `JWT_SECRET` aleatorio con `openssl rand -hex 32` antes de cualquier despliegue compartido.
- Las contraseñas de la semilla están hasheadas con bcrypt (10 rondas). El valor en texto plano `demo1234` es solo para pruebas.
