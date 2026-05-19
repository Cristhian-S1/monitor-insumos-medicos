# monitor-insumos-medicos

Monitoreo de stock de oxígeno en centros médicos.

## Base de datos

PostgreSQL con tres tablas: `hospital`, `tanque` e `historial`. El esquema y datos de ejemplo están en `tablas.sql` e `insersiones.sql`.

## Docker

Usa `docker compose` para levantar PostgreSQL 17 con un volumen nombrado (`monitor_insumos_pgdata`) que persiste los datos entre reinicios.

### Levantar

```bash
docker compose up -d
```

La base de datos queda disponible en `localhost:5433`, BD `monitor_insumos`, usuario `admin`.

### Detener

```bash
docker compose down
```

### Reiniciar desde cero (borra datos)

```bash
docker compose down -v
docker compose up -d
```
