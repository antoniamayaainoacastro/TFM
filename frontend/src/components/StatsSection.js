import React from "react";

const StatsSection = ({ videos }) => {
    // Funciones de estadística (locales al componente)
    const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const calculateGrowthRate = arr => {
        if (arr.length < 2) return 0;
        const last = arr[0];
        const first = arr[arr.length - 1];
        return first === 0 ? 0 : ((last - first) / first) * 100;
    };
    const median = arr => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    };
    const stdDev = arr => {
        const mean = average(arr);
        const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
        return Math.sqrt(average(squareDiffs));
    };

    // Cálculo de stats
    const calculateStats = (videosList) => {
        if (!videosList || videosList.length === 0) return null;
    
        const viewsData = videosList.map(v => v.views);
        const likesData = videosList.map(v => v.likes);
        const commentsData = videosList.map(v => v.comments_count);
        const averageStarsData = videosList
            .map(v => v.average_stars)
            .filter(val => val !== null && val !== undefined);

        const baseStats = {
            views: {
                min: Math.min(...viewsData),
                max: Math.max(...viewsData),
                mean: average(viewsData),
                median: median(viewsData),
                stdDev: stdDev(viewsData),
            },
            likes: {
                min: Math.min(...likesData),
                max: Math.max(...likesData),
                mean: average(likesData),
                median: median(likesData),
                stdDev: stdDev(likesData),
            },
            comments: {
                min: Math.min(...commentsData),
                max: Math.max(...commentsData),
                mean: average(commentsData),
                median: median(commentsData),
                stdDev: stdDev(commentsData),
            }
        };
    
        return {
            baseStats,
            engagement: (average(likesData) + average(commentsData)) / average(viewsData) * 100,
            viewsGrowth: calculateGrowthRate(viewsData),
            likesPerView: average(likesData) / average(viewsData) * 100,
            commentsPerView: average(commentsData) / average(viewsData) * 100,
            averageStars: averageStarsData.length > 0 ? average(averageStarsData) : 0
        };
    };

    const stats = calculateStats(videos);

    return (
        <div style={{
            flex: "0.4",
            padding: "1rem",
            borderRadius: "8px",
            background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}>
            <h3>Estadísticas Últimos Vídeos</h3>
            {(!videos || videos.length === 0) ? (
                <p>Analiza un canal para ver las estadísticas.</p>
            ) : (
                stats && (
                    <>
                        {/* Primera tabla: métricas de engagement */}
                        <div style={{ marginBottom: "2rem" }}>
                            <h4 style={{ marginBottom: "1rem", color: "#333" }}>Métricas de Engagement</h4>
                            <table style={{ 
                                width: "100%", 
                                borderCollapse: "collapse",
                                backgroundColor: "white",
                                borderRadius: "8px"
                            }}>
                                <tbody>
                                    {Object.entries({
                                        'Tasa de Engagement (%)': stats.engagement.toFixed(2),
                                        'Crecimiento de Vistas (%)': stats.viewsGrowth.toFixed(2),
                                        'Ratio Likes/Vistas (%)': stats.likesPerView.toFixed(2),
                                        'Ratio Comentarios/Vistas (%)': stats.commentsPerView.toFixed(2),
                                        'Valoración Media': stats.averageStars.toFixed(2)
                                    }).map(([key, value]) => (
                                        <tr key={key} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                            <td style={{ 
                                                padding: "0.8rem", 
                                                fontWeight: "500",
                                                color: "#444"
                                            }}>
                                                {key}
                                            </td>
                                            <td style={{ 
                                                padding: "0.8rem", 
                                                textAlign: "right",
                                                fontWeight: "600",
                                                color: "#333"
                                            }}>
                                                {value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Segunda tabla: estadísticas descriptivas */}
                        <div>
                            <h4 style={{ marginBottom: "1rem", color: "#333" }}>Estadísticas Descriptivas</h4>
                            <table style={{ 
                                width: "100%", 
                                borderCollapse: "collapse",
                                backgroundColor: "white",
                                borderRadius: "8px"
                            }}>
                                <thead style={{ backgroundColor: "#f4f4f4" }}>
                                    <tr>
                                        <th style={{ padding: "0.8rem", textAlign: "left" }}>Métrica</th>
                                        <th style={{ padding: "0.8rem", textAlign: "right" }}>Mín</th>
                                        <th style={{ padding: "0.8rem", textAlign: "right" }}>Máx</th>
                                        <th style={{ padding: "0.8rem", textAlign: "right" }}>Media</th>
                                        <th style={{ padding: "0.8rem", textAlign: "right" }}>Mediana</th>
                                        <th style={{ padding: "0.8rem", textAlign: "right" }}>Desv.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const { baseStats } = stats;
                                        const metrics = {
                                            "Vistas": baseStats.views,
                                            "Likes": baseStats.likes,
                                            "Comentarios": baseStats.comments
                                        };

                                        return Object.entries(metrics).map(([key, values]) => (
                                            <tr key={key} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                                <td style={{ padding: "0.8rem", fontWeight: "500" }}>{key}</td>
                                                <td style={{ padding: "0.8rem", textAlign: "right" }}>
                                                    {values.min.toLocaleString()}
                                                </td>
                                                <td style={{ padding: "0.8rem", textAlign: "right" }}>
                                                    {values.max.toLocaleString()}
                                                </td>
                                                <td style={{ padding: "0.8rem", textAlign: "right" }}>
                                                    {values.mean.toFixed(0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: "0.8rem", textAlign: "right" }}>
                                                    {values.median.toFixed(0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: "0.8rem", textAlign: "right" }}>
                                                    {values.stdDev.toFixed(0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </>
                )
            )}
        </div>
    );
};

export default StatsSection;
