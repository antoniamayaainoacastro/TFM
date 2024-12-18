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

router = APIRouter()

class SearchRequest(BaseModel):
    term: str

def truncate_at_last_period(text: str) -> str:
    """
    Trunca el texto en el último punto encontrado.
    Si no hay punto, devuelve el texto original.
    """
    last_period_index = text.rfind('.')
    if last_period_index != -1:
        return text[:last_period_index + 1]
    return text

@router.post("/api/define")
async def search_definition(request: SearchRequest):
    try:
        logger.info(f"Recibida solicitud de definición para: {request.term}")
        
        # Crear los mensajes para la API de OpenAI
        messages = [
            {"role": "system", "content": "Eres un experto en perfumería que proporciona definiciones precisas y profesionales."},
            {"role": "user", "content": f"Define {request.term} de forma breve y profesional en español."}
        ]
        
        # Generar definición usando OpenAI
        logger.info("Generando definición con OpenAI...")
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=200,
                temperature=0.7,
                top_p=0.9
            )
            definition = response.choices[0].message.content
            logger.info(f"Respuesta completa: {definition}")
        except Exception as e:
            logger.error(f"Error en la generación con OpenAI: {str(e)}")
            raise
        
        # Truncar en el último punto
        definition = truncate_at_last_period(definition)
        logger.info(f"Definición final extraída y truncada: {definition}")
        
        # Verificar calidad de la respuesta
        if len(definition) < 10:
            logger.warning("La definición generada es demasiado corta")
            raise ValueError("La definición generada es demasiado corta")
            
        return {
            "definition": definition,
            "prompt_system": messages[0]["content"],
            "prompt_user": messages[1]["content"]
        }
        
    except Exception as e:
        logger.error(f"Error en el proceso de definición: {str(e)}")
        logger.error("Detalles del error:", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno: {str(e)}"
        )

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