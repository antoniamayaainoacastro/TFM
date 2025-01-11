from openai import OpenAI
import logging
from typing import List, Dict, Union
import json

# Configuración del logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def analyze_parameters_from_transcription(transcription: str) -> Union[List[Dict], None]:
    """
    Analiza la transcripción para identificar perfumes y evalúa sus características en función
    de la información proporcionada en la transcripción. Devuelve los resultados en formato JSON válido.
    """
    try:
        client = OpenAI()
        logger.info("Iniciando análisis de parámetros de perfumes...")

        # Prompt estructurado
        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un asistente que analiza transcripciones de videos sobre perfumes. "
                    "Identifica perfumes mencionados en el texto y evalúa sus características "
                    "basándote únicamente en la información disponible en la transcripción."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Analiza la siguiente transcripción y devuelve un JSON con la información de los perfumes mencionados. "
                    f"Para cada perfume, incluye:\n"
                    f"1. Nombre del perfume ('perfume_name').\n"
                    f"2. Marca ('brand') o null si no se menciona.\n"
                    f"3. Puntuaciones para los ejes (entre 0 y 10, o null si no se menciona):\n"
                    f"   - 'fragancia',\n"
                    f"   - 'duracion',\n"
                    f"   - 'diseno',\n"
                    f"   - 'calidad',\n"
                    f"   - 'precio'.\n"
                    f"\n"
                    f"Devuelve los resultados exclusivamente en formato JSON válido.\n\n"
                    f"Texto a analizar:\n\n{transcription}"
                )
            }
        ]

        # Solicitud a la API de OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=1500
        )

        # Obtener el contenido de la respuesta
        result = response.choices[0].message.content.strip()

        # Eliminar delimitadores ```json si están presentes
        if result.startswith("```json"):
            result = result[7:]  # Eliminar ```json
        if result.endswith("```"):
            result = result[:-3]  # Eliminar ```

        # Convertir JSON string a Python object
        parsed_result = json.loads(result)

        # Loguear e imprimir el resultado final
        logger.info("Parametros de perfumes resultantes:")
        logger.info(parsed_result)
        print("Parametros de perfumes resultantes:")
        print(parsed_result)

        logger.info("JSON decodificado correctamente.")
        return parsed_result

    except json.JSONDecodeError as json_error:
        logger.error(f"Error al decodificar JSON: {json_error}")
        logger.debug(f"Respuesta que causó el error: {result}")
        return None
    except Exception as e:
        logger.error(f"Error en el análisis de parámetros de perfumes: {str(e)}")
        return None
