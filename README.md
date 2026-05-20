# Base de datos — PostgreSQL

## Proposito
Capa de datos. Almacena hospitales, tanques de oxígeno y su historial de niveles.

## Esquema

| Tabla | Descripción | Relaciones |
|-------|------------|------------|
| `hospital` | Centros médicos | 1:1 con `tanque` |
| `tanque` | Tanques de oxígeno | N:1 con `historial` |
| `historial` | Registro histórico de niveles | PK compuesta `(tanque_id_fk, fecha_ingreso)` |

## Archivos

- `tablas.sql` — DDL con `DROP TABLE IF EXISTS` + `CREATE TABLE`
- `insersiones.sql` — Datos iniciales 3 hospitales, 6 tanques, registros de historial

## Docker

Usa `docker compose` para levantar PostgreSQL 17 con un volumen nombrado (`monitor_insumos_pgdata`) que persiste los datos entre reinicios.

### Levantar

```bash
docker compose up -d
```

La base de datos queda disponible en `localhost:5432`, BD `monitor_insumos`, usuario `admin`.

### Detener

```bash
docker compose down
```

### Reiniciar desde cero (borra datos)

```bash
docker compose down -v
docker compose up -d
```

## Trabajar en aislamiento

Se utiliza la imagen oficial `postgres:17-alpine` para trabajar de forma aislada con postgresql sin importar que el equipo de desarrollo ocupe sistemas operativos como Windows o distribuciones GNU/Linux (i use Arch btw).

```bash
docker run -d --name monitor-insumos-db \
  -e POSTGRES_DB=monitor_insumos \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -v monitor_insumos_pgdata:/var/lib/postgresql/data \
  -v $(pwd)/tablas.sql:/docker-entrypoint-initdb.d/01-tablas.sql \
  -v $(pwd)/insersiones.sql:/docker-entrypoint-initdb.d/02-insersiones.sql \
  -p 5432:5432 \
  postgres:17-alpine
\
```

- **`docker run`** – Crea e inicia un nuevo contenedor.
- **`-d`** – Ejecuta el contenedor en segundo plano (modo *detached*).
- **`--name monitor-insumos-db`** – Asigna el nombre `monitor-insumos-db` al contenedor para facilitar su gestión.
- **`-e POSTGRES_DB=monitor_insumos`** – Define la variable de entorno que crea automáticamente la base de datos llamada `monitor_insumos`.
- **`-e POSTGRES_USER=admin`** – Establece el usuario administrador de la base de datos como `admin`.
- **`-e POSTGRES_PASSWORD=admin123`** – Define la contraseña `admin123` para el usuario `admin`.
- **`-v monitor_insumos_pgdata:/var/lib/postgresql/data`** – Crea un volumen con nombre `monitor_insumos_pgdata` y lo monta en la ruta de datos de PostgreSQL para que la información persista aunque el contenedor se elimine.
- **`-v $(pwd)/tablas.sql:/docker-entrypoint-initdb.d/01-tablas.sql`** – Monta el archivo `tablas.sql` del directorio actual en la carpeta de inicialización del contenedor. PostgreSQL ejecutará este script al arrancar por primera vez (orden 01).
- **`-v $(pwd)/insersiones.sql:/docker-entrypoint-initdb.d/02-insersiones.sql`** – Similar al anterior, monta el archivo `insersiones.sql` para que se ejecute justo después de las tablas (orden 02), insertando datos iniciales.
- **`-p 5432:5432`** – Mapea el puerto 5432 del contenedor al puerto 5432 del equipo host, permitiendo conexiones locales a PostgreSQL.
- **`postgres:17-alpine`** – Usa la imagen oficial de PostgreSQL en su versión 17, construida sobre Alpine Linux (muy ligera).

> **Nota:** `$(pwd)` devuelve la ruta absoluta del directorio actual. Asegúrese de ejecutar el comando desde la carpeta que contiene los archivos `.sql`.
