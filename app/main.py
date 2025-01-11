from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.main import router  

import os

# Crear la instancia principal de FastAPI
app = FastAPI(title="YouTube Analysis Backend")

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Cambia esto en producción a la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Incluir solo el router principal
app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the YouTube Analysis API!"}