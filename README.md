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

## Despliegue

```bash
# 1. Clonar el repositorio
git clone https://github.com/Cristhian-S1/monitor-insumos-medicos.git
cd monitor-insumos-medicos

# 2. Crear el archivo de variables de entorno
cp .env.example .env

# 3. Levantar el sistema completo con un solo comando
docker compose up -d
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
docker compose down            # Detener (conserva datos)
docker compose down -v         # Detener y eliminar datos
docker compose logs -f backend # Logs del backend en vivo
```

### Prueba de Registro de Lectura desde la UI

1. Abrir `http://146.83.102.24/` en el navegador
2. Seleccionar un hospital (ej: "Hospital Regional de Arica")
3. Seleccionar un tanque
4. Ingresar un nivel PSI (ej: 1500)
5. Clic en "Registrar lectura"
6. Verificar que el stock se actualiza

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
├── docker-compose.yml        # Orquestación 4 niveles, 2 réplicas backend
├── .env.example              # Plantilla de credenciales
├── .dockerignore
└── .gitignore
```

## Ramas del Repositorio

| Rama | Contenido |
|------|-----------|
| `postgresql` | PostgreSQL 17 + esquema + datos |
| `backend` | API REST + PostgreSQL |
| `frontend` | Frontend HTML/CSS/JS |
| `proxy` | Proxy nginx + orquestación completa |
| `main` | Integración completa |
