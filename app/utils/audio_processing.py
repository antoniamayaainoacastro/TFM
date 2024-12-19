import os
import re
import yt_dlp
import whisper
import subprocess
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
from openai import OpenAI
from app.utils.text_analysis import limpiar_y_contar, TextAnalyzer
from app.utils.perfume_analysis import analyze_perfumes_from_transcription

# Cargar variables de entorno
load_dotenv()

# Configuración de OpenAI
OpenAI.api_key = os.getenv("OPENAI_API_KEY")
if not OpenAI.api_key:
    raise ValueError("La clave de OpenAI no está configurada. Por favor, revisa el archivo .env.")


def download_audio_yt_dlp(video_url):
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
    """Descarga y combina segmentos HLS en un archivo único .wav"""
    try:
        output_dir = "downloads"
        os.makedirs(output_dir, exist_ok=True)
        output_audio = os.path.join(output_dir, "hls_output_audio.wav")

        print("Descargando y combinando segmentos HLS en un archivo único...")
        subprocess.run([
            "ffmpeg", "-y", "-i", video_url, "-acodec", "pcm_s16le", "-ac", "1", "-ar", "16000", output_audio
        ], check=True)
        print(f"Archivo de audio HLS guardado en: {output_audio}")
        return output_audio
    except Exception as e:
        print(f"Error al descargar HLS: {e}")
        return None


def transcribir_audio_whisper(audio_file):
    """Transcribe un archivo de audio usando Whisper."""
    try:
        print("\nIniciando transcripción con Whisper...")
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


def obtener_transcripcion_youtube(video_url):
    try:
        video_id = video_url.split("https://www.youtube.com/watch?v=")[-1]
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['es'])
        transcription = " ".join([item['text'] for item in transcript])
        return transcription
    except Exception as e:
        print(f"Error al obtener la transcripción con YouTubeTranscriptApi: {str(e)}")
        return None


def puntuar_texto_en_espanol(texto):
    try:
        texto = re.sub(r'\.(\s*)([a-záéíóúñ])', lambda x: x.group(1) + x.group(2).upper(), texto)
        texto = re.sub(r'\s+([.,!?])', r'\1', texto)
        if not texto.endswith('.'):
            texto += '.'
        return texto
    except Exception as e:
        print(f"Error al puntuar el texto: {e}")
        return texto


def generar_resumen(texto):
    try:
        client = OpenAI()
        print("\nGenerando resumen usando OpenAI API...")
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
    try:
        print("\n=== Intentando flujo con YouTubeTranscriptApi ===")
        analyzer = TextAnalyzer()

        transcription = obtener_transcripcion_youtube(video_url)
        if not transcription:
            print("No se pudo obtener la transcripción de YouTube. Iniciando descarga de audio con yt-dlp...")
            audio_file = download_audio_yt_dlp(video_url)

            if not audio_file:
                print("Fallo con yt-dlp. Intentando flujo alternativo con HLS...")
                audio_file = download_hls_audio(video_url)
            
            if audio_file:
                transcription = transcribir_audio_whisper(audio_file)
            else:
                print("No se pudo procesar el audio. Finalizando flujo.")
                return None

        print("\nPuntuando texto...")
        puntuado_texto = puntuar_texto_en_espanol(transcription)

        print("\nGenerando resumen...")
        resumen = generar_resumen(puntuado_texto)

        print("\nAnalizando perfumes mencionados...")
        perfume_analysis = analyze_perfumes_from_transcription(transcription)

        print("\nAnalizando texto...")
        wordcount = limpiar_y_contar(transcription)
        detected_brands = analyzer.find_brands_in_transcription(transcription)
        total_palabras = sum(frecuencia for _, frecuencia in wordcount)

        return {
            "transcription": transcription,
            "punctuated_text": puntuado_texto,
            "summary": resumen,
            "wordcount": wordcount,
            "brands": detected_brands,
            "total_palabras": total_palabras,
            "perfume_analysis": perfume_analysis
        }
    except Exception as e:
        print(f"\n❌ Error en el flujo: {str(e)}")
        return None

