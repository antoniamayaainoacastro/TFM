import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const GraphsSection = ({ latestVideo, historicalWordCount }) => {
    const videoChartRef = useRef(null);
    const channelChartRef = useRef(null);

    useEffect(() => {
        // Asegurarnos de que tenemos datos
        if (!latestVideo?.wordcount) return;
        if (!historicalWordCount?.length) return;

        const videoCanvas = document.getElementById("wordcountChart");
        const channelCanvas = document.getElementById("channelWordcountChart");

        if (!videoCanvas || !channelCanvas) return;

        const videoCtx = videoCanvas.getContext("2d");
        const channelCtx = channelCanvas.getContext("2d");

        // Destruimos gráficos anteriores
        if (videoChartRef.current) {
            videoChartRef.current.destroy();
        }
        if (channelChartRef.current) {
            channelChartRef.current.destroy();
        }

        // Gráfico del vídeo
        videoChartRef.current = new Chart(videoCtx, {
            type: "bar",
            data: {
                labels: latestVideo.wordcount.map(([word]) => word),
                datasets: [
                    {
                        label: "Conteo de Palabras del Vídeo",
                        data: latestVideo.wordcount.map(([_, count]) => count),
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });

        // Gráfico del canal
        channelChartRef.current = new Chart(channelCtx, {
            type: "bar",
            data: {
                labels: historicalWordCount.map(({ word }) => word),
                datasets: [
                    {
                        label: "Conteo de Palabras del Canal",
                        data: historicalWordCount.map(({ count }) => count),
                        backgroundColor: "rgba(255, 159, 64, 0.2)",
                        borderColor: "rgba(255, 159, 64, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });

        return () => {
            if (videoChartRef.current) {
                videoChartRef.current.destroy();
            }
            if (channelChartRef.current) {
                channelChartRef.current.destroy();
            }
        };
    }, [latestVideo, historicalWordCount]);

    return (
        <>
            {/* Gráfico de conteo de palabras del video */}
            <div style={{
                flex: "1",
                padding: "1rem",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}>
                <h3>Gráfico de Conteo de Palabras del Video</h3>
                <div style={{ height: "300px", position: "relative" }}>
                    <canvas
                        id="wordcountChart"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                        }}
                    />
                </div>
            </div>

            {/* Gráfico de conteo de palabras del canal */}
            <div style={{
                flex: "1",
                padding: "1rem",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}>
                <h3>Gráfico de Conteo de Palabras del Canal</h3>
                <div style={{ height: "300px", position: "relative" }}>
                    <canvas
                        id="channelWordcountChart"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default GraphsSection;
