import React, { useState, useMemo } from "react";

const PerfumeParameters = ({ latestVideo, isLoading: parentIsLoading, error: parentError }) => {
    const [perfumes, setPerfumes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // Manejador de ordenamiento
    const handleSort = (key) => {
        setSortConfig((prev) => {
            let direction = "asc";
            if (prev.key === key && prev.direction === "asc") {
                direction = "desc";
            }
            return { key, direction };
        });
    };

    // Ordenar perfumes
    const sortedPerfumes = useMemo(() => {
        if (!sortConfig.key) return perfumes;

        const { key, direction } = sortConfig;
        return [...perfumes].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [perfumes, sortConfig]);

    React.useEffect(() => {
        const fetchPerfumes = async () => {
            if (!latestVideo?.videoId) {
                console.log("No hay videoId disponible en latestVideo");
                return;
            }

            if (parentIsLoading) {
                console.log("El componente padre está cargando");
                return;
            }

            const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.videoId}`;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("http://localhost:8000/api/parameters", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ video_url: videoUrl }),
                });

                const data = await response.json();
                if (data.success && data.perfumes) {
                    setPerfumes(data.perfumes);
                } else {
                    setError("No se encontraron perfumes en la respuesta");
                }
            } catch (err) {
                setError("Error al obtener los parámetros de perfumes");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerfumes();
    }, [latestVideo, parentIsLoading]);

    return (
        <div className="perfume-parameters" style={{
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
                <h3 style={{ margin: 0 }}>Parámetros de Perfumes</h3>
                {isLoading && <span style={{ color: "#666" }}>Cargando...</span>}
            </div>

            <div style={{
                background: "white",
                borderRadius: "8px",
                padding: "1rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
            }}>
                {isLoading && (
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
                            Cargando parámetros de perfumes...
                        </p>
                    </div>
                )}

                {!isLoading && error && (
                    <div style={{ 
                        padding: "1rem",
                        color: "#dc3545",
                        background: "#fff5f5",
                        borderRadius: "6px",
                        border: "1px solid #ffebeb"
                    }}>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                )}

                {!isLoading && !error && perfumes.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            marginTop: "0.5rem",
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th onClick={() => handleSort("brand")} style={{ cursor: "pointer", padding: "0.5rem" }}>Marca</th>
                                    <th onClick={() => handleSort("perfume_name")} style={{ cursor: "pointer", padding: "0.5rem" }}>Nombre</th>
                                    <th onClick={() => handleSort("fragancia")} style={{ cursor: "pointer", padding: "0.5rem" }}>Fragancia</th>
                                    <th onClick={() => handleSort("duracion")} style={{ cursor: "pointer", padding: "0.5rem" }}>Duración</th>
                                    <th onClick={() => handleSort("diseno")} style={{ cursor: "pointer", padding: "0.5rem" }}>Diseño</th>
                                    <th onClick={() => handleSort("calidad")} style={{ cursor: "pointer", padding: "0.5rem" }}>Calidad</th>
                                    <th onClick={() => handleSort("precio")} style={{ cursor: "pointer", padding: "0.5rem" }}>Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPerfumes.map((perfume, index) => (
                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                                        <td style={{ padding: "0.5rem" }}>{perfume.brand || "N/A"}</td>
                                        <td style={{ padding: "0.5rem" }}>{perfume.perfume_name || "N/A"}</td>
                                        <td style={{ padding: "0.5rem" }}>{perfume.fragancia || "N/A"}</td>
                                        <td style={{ padding: "0.5rem" }}>{perfume.duracion || "N/A"}</td>
                                        <td style={{ padding: "0.5rem" }}>{perfume.diseno || "N/A"}</td>
                                        <td style={{ padding: "0.5rem" }}>{perfume.calidad || "N/A"}</td>
                                        <td style={{ padding: "0.5rem" }}>{perfume.precio || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && !error && perfumes.length === 0 && (
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
                            No se encontraron parámetros de perfumes en la respuesta.
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
                Este análisis utiliza inteligencia artificial para evaluar los parámetros de perfumes mencionados en el video o transcripción.
            </p>
        </div>
    );
};

export default PerfumeParameters;
