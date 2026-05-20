# Nivel de Presentación — Monitor de Insumos Médicos

> Interfaz web estática (HTML/CSS/JS) servida con nginx:alpine.

## Despliegue

```bash
docker compose up -d
```

La interfaz queda disponible en `http://localhost`.

## Funcionalidad

- Listado de hospitales
- Consulta de stock de oxígeno por hospital (Disponible/Agotado)
- Visualización de niveles por tanque con barras de progreso
- Formulario para registrar nuevas lecturas de PSI
- Comunicación con el backend mediante API REST (`/api/*`)

## Estructura

- `frontend/Dockerfile` — Imagen personalizada basada en `nginx:alpine`
- `frontend/index.html` — Estructura HTML
- `frontend/css/style.css` — Estilos CSS
- `frontend/js/app.js` — Lógica JavaScript (fetch a API, manipulación DOM)
