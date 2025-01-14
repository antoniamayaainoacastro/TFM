# Usar la imagen base oficial de Nginx
FROM nginx:1.27

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/share/nginx/html

# Copiar los archivos estáticos generados por el build de React
COPY ./build /usr/share/nginx/html

# Copiar el archivo nginx.conf personalizado
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 8080 para Google Cloud Run
EXPOSE 8080

# Comando predeterminado para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
