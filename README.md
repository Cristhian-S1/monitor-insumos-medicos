# Nivel de Presentación — Monitor de Insumos Médicos

> Interfaz web estática (HTML/CSS/JS) servida con nginx:alpine.

## Diseño de la Interfaz

La interfaz gráfica del panel de control se desarrolló bajo un enfoque moderno, minimalista y de alto rendimiento. 

El diseño de la aplicación está basado en la especificación de componentes y tokens de diseño detallados en el archivo [DESIGN.md](./DESIGN.md).

A continuación, se presenta una captura de la interfaz de usuario final optimizada para el monitoreo:

![Vista previa de la interfaz de monitor_insumos](assets/interfaz_preview.png)

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
