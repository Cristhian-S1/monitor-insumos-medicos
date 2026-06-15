# Monitor de Insumos Médicos

> Consulta de stock de oxígeno (Disponible/Agotado)
>
> Aplicación distribuida en 4 niveles containerizada con Docker, 3 redes aisladas y balanceo de carga entre 2 réplicas del backend.


## Arquitectura

```
Browser :80 --> Proxy (nginx:alpine) --> Frontend (nginx:alpine, HTML/CSS/JS)
                                                      |
                                                      V
                                        Backend x2 (node:18-alpine, Express)
                                                      |
                                                      V
                                             Postgres:17 (Named Volume)
```

| Nivel | Servicio | Imagen | Puerto |
|-------|----------|--------|--------|
| 1 - Proxy inverso | proxy | nginx:alpine | 80 (único expuesto al exterior) |
| 2 - Frontend | frontend | nginx:alpine custom | 80 (interno) |
| 3 - Backend (x2) | backend | node:18-alpine custom | 3000 (interno) |
| 4 - Base de datos | postgres | postgres:17 | 5432 (interno) |

**3 redes Docker con aislamiento real:**

| Red | Servicios conectados |
|-----|---------------------|
| `monitor_frontend_net` | proxy + frontend |
| `monitor_backend_net` | proxy + backend |
| `monitor_database_net` | backend + postgres |

- El frontend **no tiene acceso** a la base de datos
- La base de datos **no está expuesta** al host
- El proxy es el **único servicio** con puerto público (`80`)

## Despliegue en la VM

### 1. Conectarse al servidor

```bash
ssh dici-uta@146.83.102.24
# Usar la contraseña asignada al grupo
```

> La VM solo es accesible desde la red de la universidad.

### 2. Instalar Docker en CentOS

```bash
# Instalar dependencias
sudo yum install -y yum-utils

# Agregar repositorio oficial de Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker Engine y Compose plugin
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar y habilitar Docker
sudo systemctl enable --now docker

# Agregar el usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a entrar para que aplique el grupo
exit
ssh dici-uta@146.83.102.24
```

### 3. Clonar y levantar el proyecto

```bash
git clone https://github.com/Cristhian-S1/monitor-insumos-medicos.git
cd monitor-insumos-medicos
cp .env.example .env
docker compose up -d
```

### 4. Verificar

```bash
# Estado de los contenedores
docker compose ps

# Acceder desde el navegador a http://146.83.102.24
```

El sistema queda disponible en: **http://146.83.102.24**

## Pruebas

### 1. Prueba de Health Check

```bash
curl http://146.83.102.24/api/health
# Respuesta esperada: {"status":"ok","timestamp":"2026-05-22T..."}
```

### 2. Prueba de Stock (consulta de negocio)

```bash
curl http://146.83.102.24/api/stock/1
# Respuesta esperada: hospital, nivel_total_psi, capacidad_total_psi, porcentaje, stock (Disponible/Agotado)
```

### 3. Prueba de Balanceo de Carga (tumbar una réplica)

```bash
# Ver las 2 réplicas corriendo
docker compose ps

# Tumbar una de las réplicas del backend
docker kill $(docker ps --filter "name=backend" --format "{{.ID}}" | tail -1)

# Verificar que el sistema sigue respondiendo (la otra réplica toma el tráfico)
curl http://146.83.102.24/api/health
curl http://146.83.102.24/api/hospitales

# La réplica tumbada se recrea automáticamente (restart: unless-stopped)
docker compose ps
```

> **Nota sobre la auto-recuperación:** en `docker compose`, la política `restart: unless-stopped` **no** reconcilia la cuenta de réplicas en segundo plano. Tras `docker kill`, la réplica eliminada no vuelve sola, por lo que hay que ejecutar `docker compose up -d` para que compose restaure el conteo a 2. La prueba anterior valida que la réplica sobreviviente absorbe el tráfico, no la auto-recuperación.

### 4. Prueba de Persistencia de Datos

```bash
# 1. Insertar una nueva lectura
curl -X POST http://146.83.102.24/api/historial \
  -H "Content-Type: application/json" \
  -d '{"hospital_id_fk":1,"tanque_id_fk":1,"nivel_psi":1800,"fecha_ingreso":"2026-05-28"}'

# 2. Verificar que el stock se actualizó
curl http://146.83.102.24/api/stock/1

# 3. Destruir los contenedores (sin -v, el volumen pgdata se conserva)
docker compose down

# 4. Volver a levantar
docker compose up -d

# 5. Verificar que el dato persiste tras el reinicio
curl http://146.83.102.24/api/stock/1
# El resultado debe ser idéntico al del paso 2
```

### 5. Prueba de Aislamiento de Red

```bash
# Solo el proxy debe exponer puerto al exterior
docker compose ps | grep -E "0.0.0.0|:::"
# Solo debe aparecer: 0.0.0.0:80->80/tcp (proxy)

# El frontend NO puede contactar la base de datos
docker compose exec frontend ping postgres
# Resultado esperado: bad address 'postgres'
```

## Comandos útiles

```bash
docker compose ps              # Ver estado de todos los contenedores
docker compose down            # Detener (conserva datos e imágenes)
docker compose down -v         # Detener y eliminar datos
docker compose down --rmi all  # Detener y eliminar todas las imágenes
docker compose down --rmi local # Detener y eliminar solo imágenes locales
docker compose down -v --rmi all # Destrucción total: contenedores, datos e imágenes
docker compose logs -f backend # Logs del backend en vivo
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/hospitales` | Listar todos los hospitales |
| GET | `/api/stock/:id` | Stock del hospital (Disponible/Agotado) |
| GET | `/api/tanques/:id` | Tanques de un hospital |
| POST | `/api/historial` | Registrar nueva lectura de PSI |

### POST /api/historial — Body

```json
{
  "hospital_id_fk": 1,
  "tanque_id_fk": 1,
  "nivel_psi": 1800,
  "fecha_ingreso": "2026-05-28",
  "fecha_salida": null
}
```

## Esquema de Base de Datos

| Tabla | Descripción | Columnas clave |
|-------|-------------|----------------|
| `hospital` | Centros médicos | `hospital_id` (PK), `descripcion`, `ubicacion` |
| `tanque` | Tanques de oxígeno | `tanque_id` (PK), `color`, `estado`, `tamanio`, `hospital_actual_id` (FK) |
| `historial` | Registro de niveles PSI | PK compuesta (`tanque_id_fk`, `fecha_ingreso`), `nivel_psi` |

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de la base de datos | admin |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos | admin123 |
| `POSTGRES_DB` | Nombre de la base de datos | monitor_insumos |

## Estructura del Proyecto

```
monitor-insumos-medicos/
├── backend/                  # Nivel 3 — Lógica
│   ├── Dockerfile            #   node:18-alpine, WORKDIR, USER node
│   ├── package.json          #   express + pg
│   └── src/index.js          #   API REST (5 endpoints)
├── frontend/                 # Nivel 2 — Presentación
│   ├── Dockerfile            #   nginx:alpine, WORKDIR
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── database/                 # Nivel 4 — Datos
│   ├── tablas.sql            #   DDL: hospital, tanque, historial
│   └── insersiones.sql       #   Datos iniciales
├── nginx/                    # Nivel 1 — Proxy inverso
│   └── nginx.conf            #   resolver 127.0.0.11, balanceo entre réplicas
├── .github/workflows/
│   └── actions-smoke-test.yml #   Smoke test que valida el repo en cada push a main
├── docker-compose.yml        # Orquestación 4 niveles, 2 réplicas backend
├── .env.example              # Plantilla de credenciales
├── .dockerignore
└── .gitignore
```

## CI/CD con GitHub Actions

El repositorio incluye **un solo workflow** en `.github/workflows/`:

| Workflow | Disparador | Qué hace |
|----------|------------|----------|
| `actions-smoke-test.yml` | Push a `main` (o ejecución manual desde la pestaña Actions) | Hace checkout, valida `docker-compose.yml` con `docker compose config -q`, y verifica que los archivos clave (`backend/Dockerfile`, `frontend/Dockerfile`, `nginx/nginx.conf`, `database/tablas.sql`) existen. |

Es una prueba muy sencilla pensada para confirmar que GitHub Actions corre en el repositorio y que el repo está en un estado sano.

## Notas operacionales

- **`docker kill` no se reconcilia solo.** Si tumbas una réplica a mano, ejecuta `docker compose up -d` para restaurar la cuenta a 2. Detalles en la Prueba 3.
- **El proxy es el único puerto expuesto.** Nunca publiques `postgres`, `backend` o `frontend` al host — romperías el aislamiento de red.
- **`docker compose down -v` borra todos los datos.** El volumen `monitor_insumos_pgdata` contiene la base.

## Ramas del Repositorio

| Rama | Contenido |
|------|-----------|
| `postgresql` | PostgreSQL 17 + esquema + datos |
| `backend` | API REST + PostgreSQL |
| `frontend` | Frontend HTML/CSS/JS |
| `proxy` | Proxy nginx + orquestación completa |
| `main` | Integración completa |
