
import os
import re
import requests
from dotenv import load_dotenv

from app.utils.audio_processing import procesar_podcast

load_dotenv()
SPOTIFY_TOKEN = os.getenv("SPOTIFY_API_TOKEN")
if not SPOTIFY_TOKEN:
    raise ValueError("Falta SPOTIFY_API_TOKEN en .env")

BASE_SPOTIFY_URL = "https://api.spotify.com/v1"

def _extract_show_id(spotify_url: str) -> str:
    """
    Extrae el show_id de un URL tipo: https://open.spotify.com/show/<SHOW_ID>?...
    """
    match = re.search(r"show/([^?]+)", spotify_url)
    if match:
        return match.group(1)
    raise ValueError("No se pudo extraer show_id del URL de Spotify")

def fetch_show_data(spotify_url: str):
    """
    Obtiene datos principales del podcast (show) desde la API de Spotify.
    Incluye: nombre, descripción, publisher, followers, total_episodes, etc. (si están disponibles).
    """
    show_id = _extract_show_id(spotify_url)
    headers = {"Authorization": f"Bearer {SPOTIFY_TOKEN}"}

    url = f"{BASE_SPOTIFY_URL}/shows/{show_id}"
    params = {"market": "ES"}  # o la que corresponda
    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code != 200:
        raise ValueError(f"Error al obtener datos del show: {resp.text}")

    data = resp.json()
    # Spotify no siempre da followers para shows. A veces 'followers': {'total': 1234}
    followers = data.get("followers", {}).get("total", None)

    show_info = {
        "show_id": show_id,
        "show_name": data.get("name"),
        "publisher": data.get("publisher"),
        "description": data.get("description"),
        "media_type": data.get("media_type", "audio"),
        "total_episodes": data.get("total_episodes", 0),
        "followers": followers,   # Suscriptores
        "episodes": []
    }
    return show_info

def fetch_episodes_for_show(show_id: str, limit: int = 5):
    """
    Devuelve la lista de episodios (hasta 'limit') con campos: id, name, description, release_date, etc.
    """
    headers = {"Authorization": f"Bearer {SPOTIFY_TOKEN}"}
    url = f"{BASE_SPOTIFY_URL}/shows/{show_id}/episodes"
    params = {
        "market": "ES",
        "limit": limit
    }

    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code != 200:
        raise ValueError(f"Error al obtener episodios del show: {resp.text}")

    data = resp.json()
    episodes_data = []

    for item in data.get("items", []):
        # popularity no siempre está presente.  
        # en la doc, "popularity" a veces existe.  
        ep_popularity = item.get("popularity", None)

        episodes_data.append({
            "episode_id": item.get("id"),
            "name": item.get("name"),
            "description": item.get("description"),
            "release_date": item.get("release_date"),
            "duration_ms": item.get("duration_ms"),
            "audio_preview_url": item.get("audio_preview_url"),
            "language": item.get("language"),
            "popularity": ep_popularity,  # Indicador de "reproducciones" / relevancia
        })

    return episodes_data

def analyze_spotify_podcast(spotify_url: str, episodes_limit=5):
    """
    Función principal que:
      1) Obtiene la info del show
      2) Obtiene N episodios
      3) Procesa el último episodio con Whisper -> genera summary, wordcount, etc.
      4) Retorna un dict con toda la info (similar a lo que hace youtube_api).
    """
    try:
        show_info = fetch_show_data(spotify_url)
        show_id = show_info["show_id"]

        episodes_list = fetch_episodes_for_show(show_id, limit=episodes_limit)
        show_info["episodes"] = episodes_list

        # Procesar el último episodio (similar a youtube_api que procesa el "videos[0]")
        if episodes_list:
            latest_ep = episodes_list[0]
            audio_url = latest_ep.get("audio_preview_url")
            # Ojo: audio_preview_url es frecuentemente un snippet de 30s, no todo el podcast.
            # Si tienes la URL real del MP3, reemplaza en tu DB/flujo.
            if audio_url:
                processed_data = procesar_podcast(audio_url)
                if processed_data:
                    latest_ep["summary"] = processed_data["summary"]
                    latest_ep["wordcount"] = processed_data["wordcount"]
                    latest_ep["total_palabras"] = processed_data["total_palabras"]
                    latest_ep["perfume_analysis"] = processed_data["perfume_analysis"]
                else:
                    latest_ep["summary"] = None
                    latest_ep["wordcount"] = []
                    latest_ep["total_palabras"] = 0
                    latest_ep["perfume_analysis"] = []

        return show_info

    except Exception as e:
        print(f"Error en analyze_spotify_podcast: {e}")
        return None
