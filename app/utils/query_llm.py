from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import psycopg2
import logging
import sys

# Enhanced logging configuration
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s - %(funcName)s:%(lineno)d",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# OpenAI client configuration
client = OpenAI()

# Database configuration
DATABASE_CONFIG = {
    "dbname": "youtube_analysis",
    "user": "toniamayaobrador",
    "password": "Amaya992",
    "host": "localhost",
    "port": 5432
}

router = APIRouter()

class QueryRequest(BaseModel):
    question: str

### Helper Functions ###

def generate_sql_from_question(question: str) -> dict:
    """
    Uses OpenAI API to convert a question into an SQL query.
    """
    try:
        logger.info(f"Generating SQL query for question: {question}")

        # Crear el prompt con el contexto del esquema de la base de datos
        system_prompt = """You are a SQL query generator. Only output a SQL query, no explanations. 
        Use the following database schema:
        1. wordcount(word TEXT, count INT, video_id TEXT, created_at TIMESTAMP)
        2. videos(video_id TEXT, channel_name TEXT, video_title TEXT, total_palabras INT, total_words INT, created_at TIMESTAMP)"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transform this question into a SQL query: {question}"}
            ],
            max_tokens=150,
            temperature=0.3,
            top_p=0.9
        )

        sql_query = response.choices[0].message.content.strip()
        logger.debug(f"Generated SQL query: {sql_query}")
        
        return {
            "query": sql_query,
            "prompt": system_prompt + "\n" + question
        }
    except Exception as e:
        logger.error(f"Error generating SQL query: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating SQL query")

def sanitize_sql_query(sql_query: str) -> str:
    """
    Cleans and corrects the generated SQL query for PostgreSQL.
    """
    try:
        logger.debug(f"Sanitizing SQL query: {sql_query}")
        cleaned_query = sql_query.replace("`", '"').split(";")[0].strip() + ";"
        logger.debug(f"Sanitized SQL query: {cleaned_query}")
        return cleaned_query
    except Exception as e:
        logger.error(f"Error in sanitize_sql_query: {str(e)}")
        raise HTTPException(status_code=500, detail="Error sanitizing SQL query")

def execute_sql_query(sql_query: str):
    """
    Executes a sanitized SQL query in the PostgreSQL database.
    """
    try:
        logger.info(f"Executing SQL query: {sql_query}")
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        cursor.execute(sql_query)
        result = cursor.fetchone()
        conn.close()
        final_result = result[0] if result else 0
        logger.info(f"Query result: {final_result}")
        return final_result

    except Exception as e:
        logger.error(f"Error executing SQL: {str(e)}")
        raise HTTPException(status_code=500, detail="Error executing SQL query")

### API Endpoint ###

@router.post("/api/query")
async def query_llm(request: QueryRequest):
    try:
        logger.info(f"Received question: {request.question}")

        # Generar consulta SQL y prompt
        sql_result = generate_sql_from_question(request.question)
        logger.debug(f"Generated SQL result: {sql_result}")

        # Sanear la consulta SQL
        raw_query = sql_result.get("query")
        if not raw_query:
            logger.error("No query found in sql_result")
            raise ValueError("No SQL query generated.")

        sanitized_query = sanitize_sql_query(raw_query)
        logger.debug(f"Sanitized SQL query: {sanitized_query}")

        # Ejecutar la consulta SQL saneada
        results = execute_sql_query(sanitized_query)
        logger.info(f"Final result from query execution: {results}")

        return {"results": results}

    except Exception as e:
        logger.error(f"Error in query process: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")