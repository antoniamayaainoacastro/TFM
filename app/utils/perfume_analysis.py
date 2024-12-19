from openai import OpenAI
import logging
from typing import List, Dict

# Configuración del logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def analyze_perfumes_from_transcription(transcription: str) -> Dict:
    """
    Analiza la transcripción para extraer información sobre perfumes,
    separando la marca y el nombre, su valoración y la razón.
    """
    try:
        client = OpenAI()
        logger.info("Analizando transcripción para extraer información de perfumes...")

        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un experto en perfumería que analiza reseñas de video. "
                    "Extrae información sobre los perfumes mencionados, separando la marca del perfume y su nombre. "
                    "Además, identifica si cada perfume tiene una valoración positiva, negativa o neutra, "
                    "y describe la razón detrás de la valoración. Devuelve los resultados en formato JSON."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Analiza la siguiente transcripción y extrae la información sobre los perfumes mencionados. "
                    f"Para cada perfume, incluye:\n"
                    f"1. La marca del perfume.\n"
                    f"2. El nombre del perfume.\n"
                    f"3. Una descripción breve del perfume.\n"
                    f"4. La valoración ('positiva', 'negativa' o 'neutra').\n"
                    f"5. La razón detrás de la valoración.\n\n"
                    f"Devuelve los resultados estrictamente en formato JSON válido:\n\n{transcription}"
                )
            }
        ]

        # Solicitud a la API de OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        # Obtener el contenido de la respuesta
        result = response.choices[0].message.content
        
        # Loguear e imprimir la respuesta
        logger.info("Resultado del análisis de perfumes:")
        logger.info(result)
        print("Resultado del análisis de perfumes:")
        print(result)

        return result

    except Exception as e:
        logger.error(f"Error en el análisis de perfumes: {str(e)}")
        print(f"Error en el análisis de perfumes: {str(e)}")
        raise

