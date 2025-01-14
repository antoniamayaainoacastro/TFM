FROM python:3.10-slim

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar solo requirements.txt primero
COPY requirements.txt .

# Instalar dependencias
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Exponer el puerto 8080 para Cloud Run
ENV PORT=8080
EXPOSE 8080

# Añadir comprobación de instalación
RUN python -c "import whisper; import yt_dlp" || exit 1

# Usar Uvicorn para correr la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]