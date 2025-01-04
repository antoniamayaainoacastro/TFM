import React, { useEffect, useState } from "react";
import axios from "axios";

import ChannelInfo from "./ChannelInfo";
import TermsSearch from "./TermsSearch";
import VideosSection from "./VideosSection";
import StatsSection from "./StatsSection";
import SummaryAndQueryBox from "./SummaryAndQueryBox";
import PerfumeAnalysisSection from "./PerfumeAnalysisSection";
import WordCountSection from "./WordCountSection";
import GraphsSection from "./GraphsSection";
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
    // Aquí guardaremos el conteo histórico de palabras que obtendremos vía API
    const [historicalWordCount, setHistoricalWordCount] = useState([]);

    // 3. Al montar el componente (o cuando cambie `channel_title`), 
    //    podemos obtener el "último video" con la transcripción y wordcount (si no lo tuviéramos ya).
    //    Pero si tu backend ya te provee 'videos[0]' con todo, 
    //    puedes simplemente usar `videos[0]` y omitir esta llamada.
    //    Aun así, muestro el ejemplo de una posible llamada.

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

    // 4. Obtener el conteo histórico de palabras del canal (si no lo tuviéramos ya)
    useEffect(() => {
        if (!channel_title) return;  // Evitar llamada si no tenemos el nombre del canal

        const fetchHistoricalWordCount = async () => {
            try {
                const resp = await axios.get(
                    `http://127.0.0.1:8000/api/historical-wordcount/${channel_title}`
                );
                setHistoricalWordCount(resp.data.historical_wordcount || []);
            } catch (error) {
                console.error("Error fetching historical word count:", error);
            }
        };
        fetchHistoricalWordCount();
    }, [channel_title]);

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

            {/* Cuarta fila: análisis perfumes + conteo palabras */}
            <div style={{ display: "flex", gap: "2rem" }}>
                <PerfumeAnalysisSection latestVideo={latestVideo} />
                {/* WordCountSection necesita 'latestVideo' y 'channelTitle' 
                    para mostrar tablas, pero ahora recibirá 'historicalWordCount' directamente */}
                <WordCountSection
                    latestVideo={latestVideo}
                    historicalWordCount={historicalWordCount}
                />
            </div>

            {/* Quinta fila: gráficos */}
            <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
                {/* GraphsSection recibe la misma data (latestVideo y historicalWordCount) */}
                <GraphsSection
                    latestVideo={latestVideo}
                    historicalWordCount={historicalWordCount}
                />
            </div>

            {/* Comparación de canales */}
            <ChannelComparison currentChannelData={data} />
        </div>
    );
};

export default Dashboard;
