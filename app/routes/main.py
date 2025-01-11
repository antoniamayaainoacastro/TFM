from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field 
from typing import Any, Optional, List 
from app.utils.youtube_api import fetch_channel_videos
from app.utils.search_llm import router as search_router  
from app.database.database_service import (
    save_feedback
)
import logging
import sys
from app.utils.audio_processing import procesar_video  
from app.utils.audio_processing import transcribir_audio_whisper
from app.utils.audio_processing import download_audio_yt_dlp
from app.utils.perfume_analysis import analyze_perfumes_from_transcription
from app.utils.perfume_parameters import analyze_parameters_from_transcription

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

# Incluir las rutas del search_llm
router.include_router(search_router, prefix="")


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
