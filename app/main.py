from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.main import router  

import os
import uvicorn

# Crear la instancia principal de FastAPI
app = FastAPI(title="YouTube Analysis Backend")

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://frontend-service-320582554125.europe-southwest1.run.app",
        "http://frontend-service-320582554125.europe-southwest1.run.app",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agregar las rutas del backend
app.include_router(router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))  # Cambiar el default a 8080 para Cloud Run
    uvicorn.run("main:app", host="0.0.0.0", port=port)