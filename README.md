# Proxy Inverso — nginx:alpine

## Rol en la arquitectura

```
    Browser :80
        |
        V
proxy (nginx:alpine) -- /api/* ---> backend:3000 (Node.js Express)
        │
        V
frontend:80 (nginx, estático)
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
# API → backend (balanceo DNS round-robin entre réplicas)
location /api/ {
    set $backend_upstream backend:3000;
    proxy_pass http://$backend_upstream;
}
```

Usar `set` + variable fuerza a nginx a resolver DNS en cada solicitud (no en el arranque), distribuendo tráfico entre las réplicas del backend.

```nginx
# Todo lo demás → frontend
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


## Por qué `resolver 127.0.0.11`

`127.0.0.11` es el DNS interno de Docker. Al usar `set $backend_upstream backend:3000` y `proxy_pass http://$backend_upstream`, nginx resuelve la variable en runtime con el DNS de Docker. Esto permite el balanceo de carga automático cuando hay múltiples réplicas del backend (`--scale backend=2`).

Sin el resolver, nginx intentaría resolver `backend` en el arranque y fallaría si el backend aún no está listo. Con el resolver, resuelve en cada request.

## No reemplazar con `proxy_pass http://backend:3000` estático

Un `proxy_pass` sin variables haría que nginx resuelva la IP una sola vez al cargar la configuración. Con 2 réplicas, solo una recibiría tráfico. La variable + resolver es lo que habilita el round-robin.
