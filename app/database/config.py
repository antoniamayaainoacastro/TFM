# app/database/config.py
DATABASE_CONFIG = {
    "dbname": "youtube_analysis",
    "user": "toniamayaobrador",
    "password": "Amaya992",
    "host": "localhost",
    "port": 5432
}

import psycopg2
from datetime import datetime

def get_connection():
    """
    Establece una conexión con la base de datos PostgreSQL.
    """
    try:
        connection = psycopg2.connect(**DATABASE_CONFIG)
        return connection
    except psycopg2.Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        raise e


def create_perfumes_table():
    """
    Crea la tabla 'perfumes' si no existe.
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS perfumes (
        id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        perfume_name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        fragancia INT CHECK (fragancia BETWEEN 0 AND 10),
        duracion INT CHECK (duracion BETWEEN 0 AND 10),
        diseno INT CHECK (diseno BETWEEN 0 AND 10),
        calidad INT CHECK (calidad BETWEEN 0 AND 10),
        precio INT CHECK (precio BETWEEN 0 AND 10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(create_table_query)
        conn.commit()
        cursor.close()
        conn.close()
        print("Tabla 'perfumes' creada o ya existe.")
    except psycopg2.Error as e:
        print(f"Error al crear la tabla 'perfumes': {e}")


def insert_perfume(video_id, perfume_name, brand, fragancia, duracion, diseno, calidad, precio):
    """
    Inserta un registro en la tabla 'perfumes'.
    """
    insert_query = """
    INSERT INTO perfumes (video_id, perfume_name, brand, fragancia, duracion, diseno, calidad, precio)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id;
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            insert_query,
            (video_id, perfume_name, brand, fragancia, duracion, diseno, calidad, precio)
        )
        perfume_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Registro de perfume insertado con ID: {perfume_id}")
        return perfume_id
    except psycopg2.Error as e:
        print(f"Error al insertar perfume: {e}")
        return None


def fetch_perfumes_by_video(video_id):
    """
    Recupera los perfumes asociados a un video específico.
    """
    select_query = """
    SELECT id, perfume_name, brand, fragancia, duracion, diseno, calidad, precio, created_at
    FROM perfumes
    WHERE video_id = %s;
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(select_query, (video_id,))
        perfumes = cursor.fetchall()
        cursor.close()
        conn.close()
        return perfumes
    except psycopg2.Error as e:
        print(f"Error al recuperar perfumes: {e}")
        return None


def delete_perfume(perfume_id):
    """
    Elimina un registro de perfume por su ID.
    """
    delete_query = """
    DELETE FROM perfumes WHERE id = %s;
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(delete_query, (perfume_id,))
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Registro de perfume con ID {perfume_id} eliminado.")
    except psycopg2.Error as e:
        print(f"Error al eliminar perfume: {e}")


if __name__ == "__main__":
    # Ejemplo de uso
    create_perfumes_table()

    # Insertar un perfume de ejemplo
    insert_perfume(
        video_id="12345",
        perfume_name="Euphoria",
        brand="Calvin Klein",
        fragancia=8,
        duracion=7,
        diseno=9,
        calidad=8,
        precio=6
    )

    # Recuperar perfumes por video_id
    perfumes = fetch_perfumes_by_video("12345")
    if perfumes:
        for perfume in perfumes:
            print(perfume)

    # Eliminar un perfume por ID
    if perfumes:
        delete_perfume(perfumes[0][0])
