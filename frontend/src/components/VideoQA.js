import React, { useState, useEffect } from "react";
import axios from "axios";

const VideoQA = ({ latestVideo }) => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [error, setError] = useState("");

    const handleAskQuestion = async () => {
        if (!latestVideo || !latestVideo.videoId) {
            setError("Por favor, asegúrate de que haya un video seleccionado.");
            return;
        }

        if (!question.trim()) {
            setError("Por favor, ingresa una pregunta.");
            return;
        }

        setIsAsking(true);
        setError("");
        setAnswer("Procesando la pregunta. Esto puede tardar unos minutos...");

        const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.videoId}`;

        try {
            console.log("Enviando petición con:", {
                video_url: videoUrl,
                question: question.trim()
            });

            const response = await axios.post(
                "https://backend-service-320582554125.europe-southwest1.run.app/api/ask_question", 
                {
                    video_url: videoUrl,
                    question: question.trim()
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("Respuesta recibida:", response.data);
            
            if (response.data && response.data.answer) {
                setAnswer(response.data.answer);
                setError("");
            } else {
                throw new Error("No se recibió una respuesta válida del servidor");
            }
        } catch (error) {
            console.error("Error al realizar la pregunta:", error);
            setError(
                error.response?.data?.detail || 
                "Error al procesar la pregunta. Por favor, intenta nuevamente."
            );
            setAnswer("");
        } finally {
            setIsAsking(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isAsking) {
            handleAskQuestion();
        }
    };

    return (
        <div style={{
            padding: "1rem",
            background: "linear-gradient(to bottom, #f7f7f7, #e0e0e0)",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}>
            <h3>Preguntas sobre el Video</h3>
            <p style={{ 
                fontSize: "0.9rem", 
                color: "#555", 
                marginBottom: "1rem" 
            }}>
                Realiza preguntas basadas en la transcripción del video.
            </p>
            
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginBottom: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
                disabled={isAsking}
            />
            
            <button
                onClick={handleAskQuestion}
                disabled={isAsking}
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#333",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isAsking ? "wait" : "pointer",
                    opacity: isAsking ? 0.7 : 1,
                }}
            >
                {isAsking ? "Procesando..." : "Preguntar"}
            </button>

            {error && (
                <div style={{
                    marginTop: "1rem",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "#ffebee",
                    color: "#c62828",
                    border: "1px solid #ffcdd2",
                }}>
                    {error}
                </div>
            )}

            {answer && !error && (
                <div style={{
                    marginTop: "1rem",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}>
                    <strong>Respuesta:</strong>
                    <p style={{ 
                        fontSize: "1rem", 
                        color: "#333",
                        marginTop: "0.5rem"
                    }}>
                        {answer}
                    </p>
                </div>
            )}
        </div>
    );
};

export default VideoQA;