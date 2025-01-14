from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import logging
import sys

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Inicializar cliente de OpenAI
try:
    client = OpenAI()
    logger.info("Cliente OpenAI inicializado correctamente")
except Exception as e:
    logger.error(f"Error al inicializar cliente OpenAI: {str(e)}")
    raise




def truncate_at_last_period(text: str) -> str:
    """
    Trunca el texto en el último punto encontrado.
    Si no hay punto, devuelve el texto original.
    """
    last_period_index = text.rfind('.')
    if last_period_index != -1:
        return text[:last_period_index + 1]
    return text



# Verificar estado de la API al inicio
try:
    logger.info("Verificando conexión con OpenAI...")
    test_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Eres un experto en perfumería."},
            {"role": "user", "content": "Define prueba."}
        ],
        max_tokens=20
    )
    logger.info("Verificación de conexión con OpenAI completada exitosamente")
except Exception as e:
    logger.error(f"Error en la verificación inicial de OpenAI: {str(e)}")
    raise