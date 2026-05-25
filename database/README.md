# Database — Esquema y Datos

> Nivel 4 — Persistencia. PostgreSQL 17 con Named Volume.

## Esquema

### hospital
Centros médicos registrados.

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `hospital_id` | INT | PK, GENERATED ALWAYS AS IDENTITY |
| `descripcion` | VARCHAR(68) | -- |
| `ubicacion` | VARCHAR(68) | -- |

### tanque
Tanques de oxígeno. Relación 1:1 con hospital vía `hospital_actual_id`.

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `tanque_id` | INT | PK, GENERATED ALWAYS AS IDENTITY |
| `color` | VARCHAR(15) | -- |
| `estado` | BOOLEAN | DEFAULT true |
| `tamanio` | INT | CHECK > 0 |
| `hospital_actual_id` | INT | FK --> hospital |

### historial
Registro histórico de niveles de oxígeno. PK compuesta: `(tanque_id_fk, fecha_ingreso)`.

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `hospital_id_fk` | INT | FK → hospital |
| `tanque_id_fk` | INT | FK --> tanque |
| `nivel_psi` | INT | CHECK >= 0 |
| `fecha_ingreso` | DATE | DEFAULT CURRENT_DATE |
| `fecha_salida` | DATE | CHECK >= fecha_ingreso |

## Datos Iniciales

- 3 hospitales (Arica)
- 6 tanques distribuidos entre hospitales
- 11 registros de historial con fechas en mayo 2026

## Carga Automática

Los scripts SQL se montan en `docker-entrypoint-initdb.d/` y se ejecutan automáticamente solo en el **primer** inicio del contenedor. Para reiniciar desde cero:

```bash
docker compose down -v
docker compose up -d
```
