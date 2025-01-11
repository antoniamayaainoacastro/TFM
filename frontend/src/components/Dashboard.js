import React, { useEffect, useState } from "react";
import axios from "axios";

import ChannelInfo from "./ChannelInfo";
import TermsSearch from "./TermsSearch";
import VideosSection from "./VideosSection";
import StatsSection from "./StatsSection";
import SummaryAndQueryBox from "./SummaryAndQueryBox";
import PerfumeAnalysisSection from "./PerfumeAnalysisSection";
import PerfumeParameters from "./PerfumeParameters";
import ChannelComparison from "./ChannelComparison";

const Dashboard = ({ data }) => {
    // 1. Si no hay data inicial, mostramos el mensaje de "No hay datos..."
    if (!data) {
        return (
            <div
                style={{
                    padding: "4rem",
                    margin: "3rem",
                    background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    textAlign: "center",
                    fontFamily: "Roboto, sans-serif",
                }}
            >
                <p
                    style={{
                        fontSize: "1.2rem",
                        color: "#333",
                        margin: "1rem 0",
                    }}
                >
                    No hay datos para mostrar. Por favor, analiza un canal primero. 
                    El análisis puede tardar varios minutos. 
                </p>
            </div>
        );
    }

    // 2. Extraemos la info básica del canal y sus videos
    const { channel_title, description, videos = [] } = data;
    const [latestVideo, setLatestVideo] = useState(null);

    useEffect(() => {
        // Si tu backend ya te pasa un "videos[0]" con wordcount, 
        // basta con hacer:
        if (videos.length > 0) {
            setLatestVideo(videos[0]);
        }
        // o, si necesitas hacer un fetch a /api/last-video, 
        // descomenta este ejemplo y ajusta la ruta:
        /*
        const fetchLastVideo = async () => {
            try {
                const resp = await axios.get("http://127.0.0.1:8000/api/last-video");
                setLatestVideo(resp.data);
            } catch (error) {
                console.error("Error fetching last video:", error);
            }
        };
        fetchLastVideo();
        */
    }, [videos]);

   

    return (
        <div style={{
            padding: "2rem",
            background: "linear-gradient(to bottom, #d9d9d9, #b5b5b5)",
            fontFamily: "Roboto, sans-serif",
            minHeight: "100vh",
            margin: '0',
        }}>
            {/* Primera fila: info canal + buscador de términos */}
            <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
                <ChannelInfo
                    channelTitle={channel_title}
                    description={description}
                />
                <TermsSearch />
            </div>

            {/* Segunda fila: últimos videos + stats */}
            <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
                <VideosSection videos={videos} latestVideo={latestVideo} />
                <StatsSection videos={videos} />
            </div>

            {/* Tercera fila: resumen y query */}
            <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
                <SummaryAndQueryBox latestVideo={latestVideo} />
            </div>

            {/* Cuarta fila: análisis perfumes + parameters */}
            <div style={{ display: "flex", gap: "2rem" }}>
    <PerfumeAnalysisSection latestVideo={latestVideo} />
    <PerfumeParameters latestVideo={latestVideo} />

</div>



            {/* Comparación de canales */}
            <ChannelComparison currentChannelData={data} />
        </div>
    );
};

export default Dashboard;
