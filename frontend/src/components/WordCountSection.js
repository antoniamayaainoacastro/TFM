import React from "react";

const WordCountSection = ({ latestVideo, historicalWordCount }) => {
    return (
        <div style={{ flex: "1", display: "flex", gap: "1.5rem" }}>
            {/* Conteo de palabras del video */}
            <div style={{
                flex: "1",
                padding: "1rem",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}>
                <h3>Conteo de Palabras del Video</h3>
                {latestVideo?.wordcount ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            backgroundColor: "white",
                            borderRadius: "4px",
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f4f4f4" }}>
                                    <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Palabra</th>
                                    <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Conteo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestVideo.wordcount.map(([word, count], index) => (
                                    <tr key={index} style={{
                                        borderBottom: "1px solid #eee",
                                        backgroundColor: index % 2 === 0 ? "#fcfcfc" : "white"
                                    }}>
                                        <td style={{ padding: "0.75rem" }}>{word}</td>
                                        <td style={{ padding: "0.75rem" }}>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No hay datos de conteo disponibles.</p>
                )}
            </div>

            {/* Conteo histórico del canal */}
            <div style={{
                flex: "1",
                padding: "1rem",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}>
                <h3>Conteo Palabras Histórico del Canal</h3>
                {historicalWordCount?.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            backgroundColor: "white",
                            borderRadius: "4px",
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f4f4f4" }}>
                                    <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Palabra</th>
                                    <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Conteo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historicalWordCount.slice(0, 20).map((item, index) => (
                                    <tr key={index} style={{
                                        borderBottom: "1px solid #eee",
                                        backgroundColor: index % 2 === 0 ? "#fcfcfc" : "white"
                                    }}>
                                        <td style={{ padding: "0.75rem" }}>{item.word}</td>
                                        <td style={{ padding: "0.75rem" }}>{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p style={{
                            marginTop: "0.75rem",
                            fontSize: "0.9rem",
                            color: "#666",
                            fontStyle: "italic",
                            textAlign: "right"
                        }}>
                            Mostrando los 20 términos más frecuentes de {historicalWordCount.length} totales
                        </p>
                    </div>
                ) : (
                    <p>No hay datos históricos disponibles.</p>
                )}
            </div>
        </div>
    );
};

export default WordCountSection;
