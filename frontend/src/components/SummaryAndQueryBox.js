import React, { useState, useEffect } from "react";
import axios from "axios";

const SummaryAndQueryBox = ({ latestVideo }) => {
    // Estados relacionados con el resumen
    const [summary, setSummary] = useState("");
    const [showSummaryFeedback, setShowSummaryFeedback] = useState(false);

    // Estados relacionados con las consultas
    const [queryInput, setQueryInput] = useState("");
    const [queryResult, setQueryResult] = useState("");
    const [isQuerying, setIsQuerying] = useState(false);
    const [showQueryFeedback, setShowQueryFeedback] = useState(false);

    // Efecto para extraer el summary del último video
    useEffect(() => {
        if (latestVideo?.summary) {
            setSummary(latestVideo.summary);
        } else {
            setSummary("");
        }
    }, [latestVideo]);

    // Feedback resumen
    const handleSummaryFeedback = async (result) => {
        if (!summary) {
            console.error("No hay resumen disponible para enviar.");
            return;
        }
    
        try {
            await axios.post("https://backend-service-320582554125.europe-southwest1.run.app/api/feedback", {
                type: "summary",
                result,
                content: summary,
            });
            console.log("Feedback de resumen guardado exitosamente.");
            setShowSummaryFeedback(true);
            setTimeout(() => setShowSummaryFeedback(false), 3000);
        } catch (error) {
            console.error("Error guardando el feedback de resumen:", error);
        }
    };

    // Manejo de consultas en lenguaje natural
    const handleQuery = async () => {
        if (!queryInput.trim()) {
            setQueryResult("Por favor, escribe una consulta en lenguaje natural.");
            return;
        }

        setIsQuerying(true);
        setQueryResult("Procesando la consulta, por favor espera...");

        try {
            const response = await axios.post("https://backend-service-320582554125.europe-southwest1.run.app/api/query", {
                question: queryInput,
            });

            if (response.data && response.data.results) {
                setQueryResult(JSON.stringify(response.data.results, null, 2));
            } else {
                setQueryResult("No se encontraron resultados para la consulta.");
            }
        } catch (error) {
            console.error("Error realizando la consulta:", error);
            setQueryResult("Ocurrió un error al procesar la consulta.");
        } finally {
            setIsQuerying(false);
        }
    };

    // Feedback de la consulta
    const handleQueryFeedback = async (result) => {
        if (!queryResult) {
            console.error("No hay resultado de consulta disponible para enviar.");
            return;
        }

        const feedbackData = {
            type: "query",
            result: Boolean(result),
            content: queryResult,
            prompt: null
        };

        console.log("Enviando feedback:", feedbackData);

        try {
            await axios.post("https://backend-service-320582554125.europe-southwest1.run.app/api/feedback", feedbackData);
            setShowQueryFeedback(true);
            setTimeout(() => setShowQueryFeedback(false), 3000);
        } catch (error) {
            console.error("Error guardando el feedback de consulta:", error);
            if (error.response) {
                console.log("Error response data:", error.response.data);
            }
        }
    };

    return (
        <>
            {/* Sección de resumen del video */}
            <div style={{
                flex: "1",
                padding: "1rem",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}>
                <h3>Resumen del Video</h3>
                {summary ? (
                    <>
                        <p>{summary}</p>
                        <div style={{
                            marginTop: "1rem",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "2rem",
                        }}>
                            <span style={{
                                alignSelf: "center",
                                fontSize: "0.9rem",
                                color: "#333",
                            }}>¿Le ha resultado útil?</span>
                            <button
                                onClick={() => handleSummaryFeedback(true)}
                                style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: "#333",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                Sí
                            </button>
                            <button
                                onClick={() => handleSummaryFeedback(false)}
                                style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: "#333",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                No
                            </button>
                        </div>
                        {showSummaryFeedback && (
                            <p style={{
                                marginTop: "1rem",
                                color: "#333",
                                fontStyle: "italic",
                            }}>
                                Gracias por su valoración.
                            </p>
                        )}
                    </>
                ) : (
                    <p>No hay resumen disponible para este video.</p>
                )}
                <p style={{
                    marginTop: "1rem",
                    fontSize: "0.9rem",
                    color: "#333",
                    fontStyle: "italic",
                }}>
                    Los resumenes del contenido del vídeo son generados usando inteligencia artificial 
                    en base a la transcripción de los mismos.
                </p>
            </div>

            {/* Sección para consultas en lenguaje natural */}
            
        </>
    );
};

export default SummaryAndQueryBox;
