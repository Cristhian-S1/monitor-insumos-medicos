# Nivel de Presentación — Monitor de Insumos Médicos

> Interfaz web estática (HTML/CSS/JS) servida con nginx:alpine.

## Diseño de la Interfaz

La interfaz gráfica del panel de control se desarrolló bajo un enfoque moderno, minimalista y de alto rendimiento. El diseño de la aplicación está basado en la especificación de componentes y tokens de diseño detallados en el archivo [DESIGN.md](./DESIGN.md).

A continuación, se presenta una captura de la interfaz de usuario final optimizada para el monitoreo:

<p align="center">
  <img src="assets/interfaz_preview.png" alt="Vista previa de la interfaz de monitor_insumos" width="65%">
</p>

## Stack Tecnológico

- **Servidor base**: `nginx:alpine` (Distribución ligera para producción)
- **Frontend Core**: HTML5, CSS3 (Diseño responsivo), Vanilla JavaScript (ES6+ sin frameworks)

## Despliegue

```bash
docker compose up -d
```

La interfaz queda disponible en `http://localhost`.

## Funcionalidad

- **Dashboard**: Listado de hospitales en tarjetas interactivas.
- **Monitoreo de Stock**: Consulta de stock de oxígeno por hospital con barras de progreso y badges de estado (`Disponible` / `Agotado`).
- **Métricas de Tanques**: Visualización detallada de niveles individuales por cada tanque.
- **Ingreso de Datos**: Formulario reactivo para registrar nuevas lecturas de presión (PSI).
- **Consumo de API**: Comunicación asíncrona con el backend mediante peticiones REST (`/api/*`) estructuradas a través del proxy inverso para evitar configuraciones CORS.

## Estructura

- `Dockerfile` — Configuración para la compilación e imagen personalizada de Nginx.
- `index.html` — Estructura semántica de la interfaz y elementos del DOM.
- `css/style.css` — Hojas de estilo y diseño responsivo adaptativo.
- `js/app.js` — Lógica del cliente: consumo de API (`fetch`), promesas y manipulación dinámica del DOM.
