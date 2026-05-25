# Backend — API REST
> Nivel 3 — Lógica de negocio. Node.js 18 + Express + PostgreSQL.
## Stack
- **Runtime**: `node:18-alpine` (Alpine Linux, imagen ligera)
- **Framework**: Express 4.21
- **DB Driver**: pg 8.13
## Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production && npm cache clean --force
COPY src/ ./src/
USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
```
**Optimizaciones aplicadas:**
- `COPY package.json` antes del código --> cacheo de capas en rebuilds
- `npm install --production` --> sin devDependencies
- `npm cache clean --force` --> reduce tamaño de imagen
- `USER node` --> no corre como root
## Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/hospitales` | Listar hospitales |
| GET | `/api/stock/:id` | Stock de oxígeno |
| GET | `/api/tanques/:id` | Tanques del hospital |
| POST | `/api/historial` | Registrar lectura |
## Conexión a BD
Se conecta al host `postgres` (nombre del servicio en Docker Compose). Tiene un mecanismo de retry (10 intentos, 3s entre cada uno) para tolerar arranques lentos de PostgreSQL.
Las credenciales se leen de variables de entorno.
## Variables de Entorno
| Variable | Default | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `postgres` | Host de la BD |
| `DB_PORT` | `5432` | Puerto de la BD |
| `DB_NAME` | `monitor_insumos` | Nombre de la BD |
| `DB_USER` | -- | Usuario (requerido) |
| `DB_PASSWORD` | -- | Contraseña (requerida) |
| `PORT` | `3000` | Puerto del servidor |