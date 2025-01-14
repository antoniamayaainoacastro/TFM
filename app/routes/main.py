from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field 
from typing import Any, Optional, List 
from app.utils.youtube_api import fetch_channel_videos
from app.database.database_service import (
    save_feedback
)
import logging
import sys
from openai import OpenAI  # Añadir esta línea
import os  # Añadir esta línea
from dotenv import load_dotenv  # Añadir esta línea
from app.utils.audio_processing import procesar_video  
from app.utils.audio_processing import transcribir_audio_whisper
from app.utils.audio_processing import download_audio_yt_dlp
from app.utils.perfume_analysis import analyze_perfumes_from_transcription
from app.utils.perfume_parameters import analyze_parameters_from_transcription
from app.utils.search_llm import truncate_at_last_period 

# Cargar variables de entorno
load_dotenv()

# Inicializar el cliente OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


# Crear el enrutador principal
router = APIRouter()

# Modelo Pydantic para validar la solicitud de análisis
class AnalyzeRequest(BaseModel):
    url: str


class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    results: Any  # Cambia Any a un tipo más específico si conoces la estructura de los resultados

@router.post("/api/analyze")
async def analyze_channel(request: AnalyzeRequest):
    """
    Endpoint para analizar un canal de YouTube.
    """
    try:
        # Obtener datos del canal y procesar el último video
        channel_data = fetch_channel_videos(request.url)

        if not channel_data:
            raise HTTPException(status_code=400, detail="No se pudieron obtener los datos del canal")


        return {
            "channel_title": channel_data["channel_title"],
            "description": channel_data["description"],
            "videos": channel_data["videos"],
            
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


from typing import Optional

class FeedbackData(BaseModel):
    type: str
    result: bool
    content: str
    prompt: Optional[str] = None


@router.post("/api/feedback")
async def save_user_feedback(feedback: FeedbackData):
    """
    Endpoint para guardar la retroalimentación del usuario.
    """
    try: 
        save_feedback(
            feedback.type, 
            feedback.result, 
            feedback.content,
            feedback.prompt
        )
        return {"message": "Feedback guardado exitosamente."}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al guardar el feedback: {str(e)}"
        )


import traceback


class PerfumeAnalysisRequest(BaseModel):
    video_url: str

@router.post("/api/analyze-perfumes")
async def analyze_perfumes_endpoint(request: PerfumeAnalysisRequest):
    """
    Endpoint para analizar perfumes mencionados en un video
    """
    try:
        # Procesar el video usando la función existente
        video_data = procesar_video(request.video_url)
        
        if not video_data:
            raise HTTPException(status_code=400, detail="No se pudo procesar el video")
            
        # Extraer el análisis de perfumes
        perfume_analysis = video_data.get("perfume_analysis")
        
        if not perfume_analysis:
            raise HTTPException(status_code=404, detail="No se encontró análisis de perfumes")
            
        return {
            "success": True,
            "analysis": perfume_analysis
        }
        
    except Exception as e:
        logger.error(f"Error en el endpoint de análisis de perfumes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



class SearchRequest(BaseModel):
    term: str

class PerfumeParameter(BaseModel):
    perfume_name: Optional[str]
    brand: Optional[str]
    fragancia: Optional[int]  # Cambiado a int según los datos de ejemplo
    duracion: Optional[int]
    diseno: Optional[int]
    calidad: Optional[int]
    precio: Optional[int]


class ParametersRequest(BaseModel):
    video_url: Optional[str] = Field(default=None, description="URL del video a analizar")
    transcription: Optional[str] = Field(default=None, description="Transcripción del video")


class ParametersResponse(BaseModel):
    success: bool
    perfumes: List[PerfumeParameter]
    message: Optional[str] = None

@router.post("/api/parameters", response_model=ParametersResponse)
async def parameters_endpoint(request: ParametersRequest):
    """
    Endpoint para analizar los parámetros de perfumes desde una URL.
    """
    try:
        logger.info("Iniciando análisis de parámetros")

        # Validar que se proporcione una URL válida
        if not request.video_url:
            raise HTTPException(
                status_code=400,
                detail="Se requiere proporcionar una URL de video válida"
            )

        # Utilizar la función de análisis basada en la URL
        logger.info(f"Analizando parámetros desde la URL del video: {request.video_url}")

        # Llamada directa a la función analyze_parameters_from_transcription
        transcription = procesar_video(request.video_url)["transcription"]

        if not transcription:
            raise HTTPException(
                status_code=500,
                detail="No se pudo obtener la transcripción del video"
            )

        # Analizar la transcripción para obtener parámetros
        parameter_analysis = analyze_parameters_from_transcription(transcription)

        # Validar y procesar el resultado
        perfumes = parameter_analysis.get("perfumes", [])
        if not isinstance(perfumes, list):
            logger.error("El resultado del análisis no contiene una lista válida de perfumes")
            raise HTTPException(
                status_code=500,
                detail="El análisis de parámetros no devolvió una lista válida"
            )

        # Retornar los parámetros analizados
        return ParametersResponse(
            success=True,
            perfumes=perfumes,
            message="Análisis de parámetros completado correctamente"
        )

    except HTTPException as http_ex:
        logger.error(f"Error HTTP: {http_ex.detail}")
        raise

    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error en el análisis de parámetros: {str(e)}"
        )

@router.post("/api/define")
async def search_definition(request: SearchRequest):
    try:
        logger.info(f"Recibida solicitud de definición para: {request.term}")
        
        messages = [
            {"role": "system", "content": "Eres un experto en perfumería que proporciona definiciones precisas y profesionales."},
            {"role": "user", "content": f"Define {request.term} de forma breve y profesional en español."}
        ]
        
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
        
        # Now truncate_at_last_period is available
        definition = truncate_at_last_period(definition)
        logger.info(f"Definición final extraída y truncada: {definition}")
        
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

from fastapi import APIRouter, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
import logging

# Configurar logging
logger = logging.getLogger(__name__)

class QuestionRequest(BaseModel):
    video_url: str
    question: str

@router.post("/api/ask_question")
async def ask_question(request: QuestionRequest):
    """
    Endpoint para realizar preguntas basadas en la transcripción de un video.
    """
    logger.info(f"Endpoint ask_question llamado con URL: {request.video_url} y pregunta: {request.question}")
    
    try:
        # 1. Extraer video ID
        try:
            video_id = request.video_url.split("watch?v=")[-1]
            if not video_id:
                raise ValueError("URL de video inválida")
            logger.info(f"Video ID extraído: {video_id}")
        except Exception as e:
            logger.error(f"Error al procesar la URL del video: {str(e)}")
            raise HTTPException(status_code=400, detail="URL de video inválida")

        # 2. Obtener transcripción
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['es'])
            transcription = " ".join([item['text'] for item in transcript])
            
            if not transcription.strip():
                logger.warning("La transcripción está vacía")
                raise ValueError("La transcripción está vacía")
                
            logger.info("Transcripción obtenida exitosamente")
        except Exception as e:
            logger.error(f"Error al obtener la transcripción: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail="Error al obtener la transcripción. Verifica que el video exista y tenga subtítulos en español."
            )

        # 3. Preparar mensajes para OpenAI
        messages = [
            {
                "role": "system", 
                "content": "Eres un experto en análisis de videos que responde preguntas basadas en la transcripción."
            },
            {
                "role": "user", 
                "content": f"Transcripción: {transcription}\nPregunta: {request.question}"
            }
        ]
        
        # 4. Generar respuesta usando OpenAI
        logger.info("Generando respuesta con OpenAI...")
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=300,
                temperature=0.7,
                top_p=0.9
            )
            answer = response.choices[0].message.content.strip()
            logger.info("Respuesta generada exitosamente")
        except Exception as e:
            logger.error(f"Error en la generación con OpenAI: {str(e)}")
            raise

        # 5. Verificar calidad de la respuesta
        if len(answer) < 10:
            logger.warning("La respuesta generada es demasiado corta")
            raise ValueError("La respuesta generada es demasiado corta")

        return {
            "success": True,
            "video_id": video_id,
            "question": request.question,
            "answer": answer,
            "prompt_system": messages[0]["content"],
            "prompt_user": messages[1]["content"]
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error en el proceso de pregunta: {str(e)}")
        logger.error("Detalles del error:", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )