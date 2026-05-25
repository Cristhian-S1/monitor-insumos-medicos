# Monitor de Insumos Médicos

> Consulta de stock de oxígeno (Disponible/Agotado)
>
> Aplicación distribuida en 4 niveles con Docker, 3 redes aisladas y balanceo de carga entre 2 réplicas del backend.

## Arquitectura

```
Browser :80 --> Proxy (nginx:alpine) --> Frontend (nginx:alpine, HTML/CSS/JS)
                                                            |
                                                            |
                                                            V
                                          Backend x 2 (node:18-alpine, Express)
                                                            |
                                                            |
                                                            V
                                                  Postgres:17 (Named Volume)
```

**3 redes Docker con aislamiento real:**

| Red | Servicios conectados |
|-----|---------------------|
| `monitor_frontend_net` | proxy + frontend |
| `monitor_backend_net` | proxy + backend |
| `monitor_database_net` | backend + postgres |

- El frontend no tiene acceso directo a la base de datos
- La base de datos no está expuesta al host
- El proxy es el único servicio con puerto público (`80`)

## Comandos

```bash
docker compose up -d                      # Iniciar (1 réplica backend)
docker compose up -d --scale backend=2    # Iniciar con 2 réplicas
docker compose down                       # Detener (conserva datos)
docker compose down -v                    # Detener y eliminar datos
docker compose ps                         # Ver estado de contenedores
docker compose logs -f backend            # Logs del backend en vivo
docker compose logs backend               # Logs de todas las réplicas
docker rmi -f nombre_imagen               # Eliminar imagen de docker 
docker rmi -f $(docker images -a -q)      # Eliminar todas las imagenes
```

## Pruebas 

### 1. Prueba de Health Check

```bash
curl http://localhost/api/health
# Respuesta esperada: {"status":"ok","timestamp":"2026-05-22T..."}
```

### 2. Prueba de Stock (consulta de negocio)

```bash
curl http://localhost/api/stock/1
# Respuesta esperada: hospital, nivel_total_psi, capacidad_total_psi, porcentaje, stock (Disponible/Agotado)
```

### 3. Prueba de Balanceo de Carga (tumbar una réplica)

```bash
# Ver las 2 réplicas corriendo
docker compose ps

# Tumbar una de las réplicas del backend
docker kill $(docker ps --filter "name=backend" --format "{{.ID}}" | tail -1)

# Verificar que el sistema sigue respondiendo (la otra réplica toma el tráfico)
curl http://localhost/api/health
curl http://localhost/api/hospitales

# La réplica tumbada se recrea automáticamente (restart: unless-stopped)
docker compose ps
```

### 4. Prueba de Persistencia de Datos

```bash
# 1. Insertar un nuevo registro de historial
curl -X POST http://localhost/api/historial \
  -H "Content-Type: application/json" \
  -d '{"hospital_id_fk":1,"tanque_id_fk":1,"nivel_psi":999,"fecha_ingreso":"2026-05-22"}'

# 2. Destruir todos los contenedores (sin -v, conserva el volumen)
docker compose down

# 3. Volver a levantar
docker compose up -d --scale backend=2

# 4. Verificar que el dato persiste
curl http://localhost/api/stock/1
# El nivel_total_psi debe reflejar la nueva lectura de 999 PSI
```

### 5. Prueba de Escalado

```bash
# Levantar con 3 réplicas
docker compose up -d --scale backend=3
docker compose ps | grep backend

# Verificar que todas responden
for i in 1 2 3; do curl -s http://localhost/api/health; echo; done
```

### 6. Prueba de Aislamiento de Red

```bash
# Verificar que la base de datos NO está expuesta al host
docker compose ps | grep postgres
# No debe mostrar mapeo de puertos (solo el puerto interno 5432)

# Verificar que solo el proxy expone el puerto 80
docker compose ps | grep -E "0.0.0.0|:::"
# Solo el proxy debe tener 0.0.0.0:80->80/tcp
```

### Prueba de Registro de Lectura desde la UI

1. Abrir `http://localhost/` en el navegador
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
  "nivel_psi": 1500,
  "fecha_ingreso": "2026-05-22",
  "fecha_salida": null
}
```

## Esquema de Base de Datos

| Tabla | Descripción | Columnas clave |
|-------|-------------|----------------|
| `hospital` | Centros médicos | `hospital_id` (PK, GENERATED ALWAYS AS IDENTITY), `descripcion`, `ubicacion` |
| `tanque` | Tanques de oxígeno | `tanque_id` (PK, GENERATED ALWAYS AS IDENTITY), `color`, `estado`, `tamanio`, `hospital_actual_id` (FK) |
| `historial` | Registro de niveles | PK compuesta (`tanque_id_fk`, `fecha_ingreso`), `nivel_psi`, FKs a hospital y tanque |

## Estructura del Proyecto

```
container-app-docker/
├── backend/                  # Nivel 3 — Lógica
│   ├── Dockerfile            #   node:18-alpine, WORKDIR, USER node
│   ├── package.json          #   express + pg
│   └── src/index.js          #   API REST (5 endpoints)
├── frontend/                 # Nivel 2 — Presentación
│   ├── Dockerfile            #   nginx:alpine, COPY optimizado
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── database/                 # Nivel 4 — Datos (scripts)
│   ├── tablas.sql            #   DDL: hospital, tanque, historial
│   └── insersiones.sql       #   Datos iniciales
├── nginx/                    # Nivel 1 — Proxy
│   └── nginx.conf            #   resolver 127.0.0.11, proxy_pass dinámico
├── docker-compose.yml        # Orquestación 4 niveles
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



