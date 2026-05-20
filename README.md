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
