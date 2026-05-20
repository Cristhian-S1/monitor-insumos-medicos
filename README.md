# Proxy Inverso — nginx:alpine

## Rol en la arquitectura

```
Browser :80
    │
    ▼
proxy (nginx:alpine) ── /api/* ──► backend:3000 (Node.js Express)
    │
    └── /* ────────────► frontend:80 (nginx, estático)
```

El proxy es el **único punto de entrada** al sistema. El frontend y backend no exponen puertos al host.

## Configuración (`nginx.conf`)

### Resolver DNS (`127.0.0.11`)

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;
```

`127.0.0.11` es el servidor DNS interno de Docker. nginx re-resuelve los nombres cada 10 segundos para adaptarse a cambios dinámicos (ej: escalar el backend a 2 réplicas).

### Ruteo por ubicación

```nginx
location /api/ {
    set $backend_upstream backend:3000;
    proxy_pass http://$backend_upstream;
}
```

Usar `set` + variable fuerza a nginx a resolver DNS en cada solicitud (no en el arranque), distribuendo tráfico entre las réplicas del backend.

```nginx
location / {
    set $frontend_upstream frontend:80;
    proxy_pass http://$frontend_upstream;
}
```

### Headers enviados al upstream

| Header | Propósito |
|--------|-----------|
| `Host` | Preserva el host original del cliente |
| `X-Real-IP` | IP real del cliente |
| `X-Forwarded-For` | Cadena de proxies para logging |
| `X-Forwarded-Proto` | Protocolo original (http/https) |

### Timeouts

```nginx
proxy_read_timeout 30s;
proxy_connect_timeout 5s;
```
