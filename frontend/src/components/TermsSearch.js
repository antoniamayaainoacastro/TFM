import React, { useState } from "react";
import axios from "axios";

const TermsSearch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [definition, setDefinition] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showDefinitionFeedback, setShowDefinitionFeedback] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setDefinition("Por favor, ingresa un término para buscar.");
            return;
        }
        setIsSearching(true);
        setDefinition(
            "La búsqueda puede tardar varios minutos. " +
            "Los resultados han sido generados utilizando inteligencia artificial. " +
            "No utilice las definiciones con fines médicos, legales o técnicos."
        );

        try {
            const response = await axios.post("https://backend-service-320582554125.europe-west4.run.app/api/define", {
                term: searchTerm
            });
            setDefinition(response.data.definition || "No se encontró una definición.");
        } catch (error) {
            console.error("Error buscando definición:", error);
            setDefinition("Ocurrió un error al buscar la definición.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDefinitionFeedback = async (result) => {
        if (!definition) {
            console.error("No hay definición disponible para enviar.");
            return;
        }
        try {
            await axios.post("https://backend-service-320582554125.europe-west4.run.app/api/feedback", {
                type: "definition",
                result,            // true o false
                content: definition,
            });
            console.log("Feedback de definición guardado exitosamente.");
            setShowDefinitionFeedback(true);
            setTimeout(() => setShowDefinitionFeedback(false), 3000);
        } catch (error) {
            console.error("Error guardando el feedback de definición:", error);
        }
    };

    return (
        <div style={{
            flex: "1",
            padding: "1rem",
            borderRadius: "8px",
            background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}>
            <h3>Buscar Término</h3>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escribe un término..."
                style={{
                    width: "95%",
                    padding: "0.5rem",
                    marginBottom: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
            />
            <button
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#333",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isSearching ? "wait" : "pointer",
                    opacity: isSearching ? 0.7 : 1,
                }}
            >
                {isSearching ? "Buscando..." : "Buscar"}
            </button>

            {definition && (
                <div style={{
                    marginTop: "1rem",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}>
                    <strong>Definición:</strong>
                    <p style={{
                        fontSize: isSearching ? "0.9rem" : "1rem",
                        color: isSearching ? "#666" : "#333",
                        fontStyle: isSearching ? "italic" : "normal"
                    }}>
                        {definition}
                    </p>
                    <div style={{
                        marginTop: "1rem",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "1rem"
                    }}>
                        <span style={{
                            alignSelf: "center",
                            fontSize: "0.9rem",
                            color: "#333",
                        }}>
                            ¿Le ha resultado útil?
                        </span>
                        <button
                            onClick={() => handleDefinitionFeedback(true)} 
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
                            onClick={() => handleDefinitionFeedback(false)}
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

                    {showDefinitionFeedback && (
                        <p style={{
                            marginTop: "1rem",
                            color: "#333",
                            fontStyle: "italic"
                        }}>
                            Gracias por su valoración.
                        </p>
                    )}
                </div>
            )}

            <p style={{
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: "#333",
                fontStyle: "italic",
            }}>
                Este buscador de términos genera respuestas a búsquedas terminológicas usando inteligencia artificial.
            </p>
        </div>
    );
};

export default TermsSearch;
