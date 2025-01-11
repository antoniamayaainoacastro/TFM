from app.database.models import get_db_connection


def check_video_exists(video_id):
    """
    Verifica si un video ya existe en la base de datos.
    Args:
        video_id: ID del video a verificar
    Returns:
        Boolean indicando si existe
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = "SELECT 1 FROM wordcount WHERE video_id = %s LIMIT 1;"
            cursor.execute(query, (video_id,))
            return cursor.fetchone() is not None
    except Exception as e:
        print(f"❌ Error al verificar video: {e}")
        return False
    finally:
        conn.close()


def save_feedback(feedback_type, result, content, prompt=None):
    """
    Guarda el feedback en la base de datos incluyendo el prompt.


    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO feedback (type, result, content, prompt) 
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (feedback_type, result, content, prompt or None))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error al guardar el feedback: {e}")
        raise
