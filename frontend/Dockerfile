FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
