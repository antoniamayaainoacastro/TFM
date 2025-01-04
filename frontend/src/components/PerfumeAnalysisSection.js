import React, { useEffect, useState } from "react";
import axios from "axios";

const PerfumeAnalysisSection = ({ latestVideo }) => {
    const [perfumeAnalysis, setPerfumeAnalysis] = useState([]);
    const [isLoadingPerfumes, setIsLoadingPerfumes] = useState(false);
    const [perfumeError, setPerfumeError] = useState(null);

    useEffect(() => {
        const fetchPerfumeAnalysis = async () => {
            if (!latestVideo?.videoId) {
                console.warn("No videoId found in latestVideo");
                setPerfumeError("No se encontró ID de video válido");
                return;
            }
        
            setIsLoadingPerfumes(true);
            setPerfumeError(null);
        
            try {
                const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.videoId}`;
                console.log("Fetching perfume analysis for:", videoUrl);
        
                const response = await axios.post(
                    "http://127.0.0.1:8000/api/analyze-perfumes",
                    { video_url: videoUrl }
                );
        
                console.log("Raw API Response:", response.data);
        
                let parsedData;
                try {
                    if (typeof response.data === 'string') {
                        // Limpieza de caracteres escapados
                        let cleanData = response.data
                            .replace(/\\n/g, '')
                            .replace(/\\"/g, '"')
                            .replace(/"{/g, '{')
                            .replace(/}"/g, '}')
                            .replace(/\\/g, '');
        
                        parsedData = JSON.parse(cleanData);
                    } else {
                        parsedData = response.data;
                    }
        
                    // Si analysis viene como string, parsear nuevamente
                    if (typeof parsedData.analysis === 'string') {
                        parsedData.analysis = JSON.parse(parsedData.analysis);
                    }
        
                    console.log("Parsed data:", parsedData);
        
                    // Extracción de perfumes
                    let perfumes = null;
                    if (parsedData?.analysis?.perfumes) {
                        if (typeof parsedData.analysis.perfumes === 'string') {
                            perfumes = JSON.parse(parsedData.analysis.perfumes);
                        } else {
                            perfumes = parsedData.analysis.perfumes;
                        }
                    } else if (parsedData?.perfumes) {
                        if (typeof parsedData.perfumes === 'string') {
                            perfumes = JSON.parse(parsedData.perfumes);
                        } else {
                            perfumes = parsedData.perfumes;
                        }
                    }
        
                    console.log("Extracted perfumes:", perfumes);
        
                    if (Array.isArray(perfumes) && perfumes.length > 0) {
                        setPerfumeAnalysis(perfumes);
                        setPerfumeError(null);
                    } else {
                        setPerfumeError("No se encontraron datos de perfumes válidos");
                        setPerfumeAnalysis([]);
                    }
                } catch (parseError) {
                    console.error("Error parsing response:", parseError);
                    console.log("Failed data:", response.data);
                    setPerfumeError("Error al procesar los datos de perfumes");
                    setPerfumeAnalysis([]);
                }
            } catch (error) {
                console.error("Error in perfume analysis:", error);
                setPerfumeError(error.message || "Error al analizar perfumes");
                setPerfumeAnalysis([]);
            } finally {
                setIsLoadingPerfumes(false);
            }
        };

        // Llamamos a fetchPerfumeAnalysis si hay un vídeo válido
        if (latestVideo) {
            fetchPerfumeAnalysis();
        }
    }, [latestVideo]);

    return (
        <div style={{
            flex: "1",
            padding: "1.5rem",
            borderRadius: "12px",
            background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
            }}>
                <h3 style={{ margin: 0 }}>Análisis de Perfumes</h3>
            </div>
            
            <div style={{
                background: "white",
                borderRadius: "8px",
                padding: "1rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
            }}>
                {isLoadingPerfumes && (
                    <div style={{ 
                        padding: "2rem",
                        textAlign: "center",
                        background: "#f8f9fa",
                        borderRadius: "6px"
                    }}>
                        <p style={{ 
                            margin: 0,
                            color: "#666",
                            fontSize: "1.1rem"
                        }}>
                            Analizando perfumes...
                        </p>
                    </div>
                )}
                
                {!isLoadingPerfumes && perfumeError && (
                    <div style={{ 
                        padding: "1rem",
                        color: "#dc3545",
                        background: "#fff5f5",
                        borderRadius: "6px",
                        border: "1px solid #ffebeb"
                    }}>
                        <p style={{ margin: 0 }}>{perfumeError}</p>
                    </div>
                )}
                
                {!isLoadingPerfumes && !perfumeError && Array.isArray(perfumeAnalysis) && perfumeAnalysis.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            marginTop: "0.5rem",
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th style={{ 
                                        padding: "1rem",
                                        borderBottom: "2px solid #dee2e6",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        color: "#495057"
                                    }}>
                                        Marca
                                    </th>
                                    <th style={{ 
                                        padding: "1rem",
                                        borderBottom: "2px solid #dee2e6",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        color: "#495057"
                                    }}>
                                        Nombre
                                    </th>
                                    <th style={{ 
                                        padding: "1rem",
                                        borderBottom: "2px solid #dee2e6",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        color: "#495057"
                                    }}>
                                        Descripción
                                    </th>
                                    <th style={{ 
                                        padding: "1rem",
                                        borderBottom: "2px solid #dee2e6",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        color: "#495057"
                                    }}>
                                        Valoración
                                    </th>
                                    <th style={{ 
                                        padding: "1rem",
                                        borderBottom: "2px solid #dee2e6",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        color: "#495057"
                                    }}>
                                        Razón de Valoración
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {perfumeAnalysis.map((perfume, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                                            transition: "background-color 0.2s ease"
                                        }}
                                    >
                                        <td style={{ 
                                            padding: "1rem",
                                            borderBottom: "1px solid #dee2e6",
                                            fontWeight: "500"
                                        }}>
                                            {perfume.marca}
                                        </td>
                                        <td style={{ 
                                            padding: "1rem",
                                            borderBottom: "1px solid #dee2e6"
                                        }}>
                                            {perfume.nombre}
                                        </td>
                                        <td style={{ 
                                            padding: "1rem",
                                            borderBottom: "1px solid #dee2e6"
                                        }}>
                                            {perfume.descripcion}
                                        </td>
                                        <td style={{
                                            padding: "1rem",
                                            borderBottom: "1px solid #dee2e6",
                                            color: perfume.valoracion === "positiva" ? "#28a745" : "#dc3545",
                                            fontWeight: "500"
                                        }}>
                                            {perfume.valoracion}
                                        </td>
                                        <td style={{ 
                                            padding: "1rem",
                                            borderBottom: "1px solid #dee2e6"
                                        }}>
                                            {perfume.razon_valoracion}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {!isLoadingPerfumes && !perfumeError && (!Array.isArray(perfumeAnalysis) || perfumeAnalysis.length === 0) && (
                    <div style={{ 
                        padding: "2rem",
                        textAlign: "center",
                        background: "#f8f9fa",
                        borderRadius: "6px"
                    }}>
                        <p style={{
                            margin: 0,
                            color: "#666",
                            fontSize: "1.1rem"
                        }}>
                            No se encontraron datos de perfumes en la respuesta.
                        </p>
                    </div>
                )}
            </div>

            <p style={{
                marginTop: "1.5rem",
                fontSize: "0.9rem",
                color: "#666",
                fontStyle: "italic",
                textAlign: "center",
                padding: "0 1rem"
            }}>
                Este análisis utiliza inteligencia artificial para extraer información 
                sobre perfumes mencionados en el video.
            </p>
        </div>
    );
};

export default PerfumeAnalysisSection;
