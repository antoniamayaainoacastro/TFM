import os
import re
import yt_dlp
import whisper
import subprocess
from dotenv import load_dotenv
from openai import OpenAI
from app.utils.text_analysis import limpiar_y_contar, TextAnalyzer
from app.utils.perfume_analysis import analyze_perfumes_from_transcription
from app.utils.perfume_parameters import analyze_parameters_from_transcription

# Cargar variables de entorno
load_dotenv()
OpenAI.api_key = os.getenv("OPENAI_API_KEY")
if not OpenAI.api_key:
    raise ValueError("La clave de OpenAI no está configurada. Por favor, revisa el archivo .env.")


def download_audio_yt_dlp(video_url):
    """
    Descarga un audio de YouTube con yt-dlp y lo convierte en .wav
    """
    try:
        output_dir = "downloads"
        os.makedirs(output_dir, exist_ok=True)

        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'wav'}],
            'outtmpl': os.path.join(output_dir, '%(id)s.%(ext)s'),
            'keepvideo': True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(video_url, download=True)
            audio_path = os.path.join(output_dir, f"{result['id']}.wav")
            return audio_path
    except Exception as e:
        print(f"Error al descargar audio con yt-dlp: {e}")
        return None


def download_hls_audio(video_url):
    """
    Descarga y combina segmentos HLS en un archivo único .wav (flujo alternativo).
    """
    try:
        output_dir = "downloads"
        os.makedirs(output_dir, exist_ok=True)
        output_audio = os.path.join(output_dir, "hls_output_audio.wav")

        subprocess.run([
            "ffmpeg", "-y", "-i", video_url, "-acodec", "pcm_s16le", "-ac", "1", "-ar", "16000", output_audio
        ], check=True)
        return output_audio
    except Exception as e:
        print(f"Error al descargar HLS: {e}")
        return None


def transcribir_audio_whisper(audio_file):
    """
    Transcribe un archivo de audio usando Whisper.
    """
    try:
        print("Iniciando transcripción con Whisper...")
        model = whisper.load_model("small", device="cpu")
        result = model.transcribe(audio_file, language="es", task="transcribe")
        if result and "text" in result and result["text"].strip():
            print("Transcripción completada con Whisper.")
            return result["text"]
        else:
            print("La transcripción con Whisper está vacía.")
            return None
    except Exception as e:
        print(f"Error en la transcripción con Whisper: {e}")
        return None


def puntuar_texto_en_espanol(texto):
    """
    Corrige un poco la puntuación de un texto en español.
    """
    try:
        texto = re.sub(r'\.(\s*)([a-záéíóúñ])', lambda x: '.' + x.group(1) + x.group(2).upper(), texto)
        texto = re.sub(r'\s+([.,!?])', r'\1', texto)
        if not texto.endswith('.'):
            texto += '.'
        return texto
    except Exception as e:
        print(f"Error al puntuar el texto: {e}")
        return texto


def generar_resumen(texto):
    """
    Genera un resumen con OpenAI GPT a partir de un texto largo.
    """
    try:
        client = OpenAI()
        prompt = f"Resume el siguiente texto en español manteniendo las ideas clave:\n\n{texto}"

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente que proporciona resúmenes de textos."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=512,
            temperature=0.7
        )

        resumen = response.choices[0].message.content
        return resumen.strip()
    except Exception as e:
        print(f"Error al generar el resumen: {e}")
        return None


def procesar_video(video_url):
    """
    Flujo de procesamiento específico para un video de YouTube.
    - Intenta usar la API de YouTubeTranscriptApi.
    - Si falla, descarga el audio y transcribe con Whisper.
    - Genera resumen, wordcount y análisis de perfumes y parámetros.
    """
    from youtube_transcript_api import YouTubeTranscriptApi

    try:
        analyzer = TextAnalyzer()

        # 1. Intentar transcripción con YouTubeTranscriptApi
        video_id = video_url.split("watch?v=")[-1]
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['es'])
        transcription = " ".join([item['text'] for item in transcript])

        # 2. Si no hay transcripción, descargar con yt-dlp
        if not transcription:
            audio_file = download_audio_yt_dlp(video_url)
            if not audio_file:
                audio_file = download_hls_audio(video_url)
            if audio_file:
                transcription = transcribir_audio_whisper(audio_file)
            else:
                return None

        # 3. Puntuación y resumen
        puntuado_texto = puntuar_texto_en_espanol(transcription)
        resumen = generar_resumen(puntuado_texto)

        # 4. Análisis de perfumes y parámetros
        perfume_analysis = analyze_perfumes_from_transcription(transcription)
        parameter_analysis = analyze_parameters_from_transcription(transcription)
        detected_brands = analyzer.find_brands_in_transcription(transcription)

        return {
            "transcription": transcription,
            "punctuated_text": puntuado_texto,
            "summary": resumen,
            "brands": detected_brands,
            "perfume_analysis": perfume_analysis,
            "parameter_analysis": parameter_analysis
        }
    except Exception as e:
        print(f"Error en procesar_video con YouTubeTranscriptApi: {str(e)}")
        return _procesar_audio_generico(video_url)


def _procesar_audio_generico(source_url):
    """
    Fallback para cuando no se obtenga transcripción de YouTubeTranscriptApi.
    Descarga y transcribe con Whisper.
    """
    try:
        analyzer = TextAnalyzer()

        print("Intentando descarga de audio (yt-dlp/HLS) como fallback...")
        audio_file = download_audio_yt_dlp(source_url)
        if not audio_file:
            audio_file = download_hls_audio(source_url)

        if not audio_file:
            print("No se pudo procesar el audio. Finalizando flujo.")
            return None

        transcription = transcribir_audio_whisper(audio_file)
        if not transcription:
            return None

        puntuado_texto = puntuar_texto_en_espanol(transcription)
        resumen = generar_resumen(puntuado_texto)
        perfume_analysis = analyze_perfumes_from_transcription(transcription)
        parameter_analysis = analyze_parameters_from_transcription(transcription)
        detected_brands = analyzer.find_brands_in_transcription(transcription)

        return {
            "transcription": transcription,
            "punctuated_text": puntuado_texto,
            "summary": resumen,
            "brands": detected_brands,
            "perfume_analysis": perfume_analysis,
            "parameter_analysis": parameter_analysis
        }
    except Exception as e:
        print(f"Error en _procesar_audio_generico: {e}")
        return None
