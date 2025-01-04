import React, { useState, useMemo } from "react";

const PERFUME_BRANDS = [
    "Tom Ford", "Dior", "Chanel", "Gucci", "Yves Saint Laurent", "Versace", "Hermès", 
    "Prada", "Dolce & Gabbana", "Givenchy", "Burberry", "Armani", "Hugo Boss", "Calvin Klein",
    "Lacoste", "Marc Jacobs", "Ralph Lauren", "Paco Rabanne", "Carolina Herrera", 
    "Jean Paul Gaultier", "Valentino", "Balenciaga", "Bulgari", "Fendi", "Lancome", 
    "Victoria's Secret", "Zara", "Mercadona", "Amouage", "Creed", "Maison Francis Kurkdjian", 
    "Byredo", "Le Labo", "Diptyque", "Frederic Malle", "Jo Malone", "Penhaligon's", "Aesop", 
    "Xerjoff", "Clive Christian", "Parfums de Marly", "Roja Parfums", "Mancera", "Montale", 
    "Initio", "Tiziana Terenzi", "Nishane", "Serge Lutens", "Comme des Garçons", 
    "Etat Libre d'Orange", "Zoologist", "Acqua di Parma", "BDK Parfums", "Carner Barcelona", 
    "Memo Paris", "Floris London", "Bond No.9", "Vilhelm Parfumerie", "Histoires de Parfums", 
    "Masque Milano", "The Different Company", "Atelier Cologne", "Maison Margiela", 
    "Ormonde Jayne", "House of Oud", "Olfactive Studio", "The Harmonist", "Viktor & Rolf",
    "Kilian", "Nasomatto", "Profumum Roma", "Nicolai", "Fueguia 1833", "Eight & Bob",
    "Juliette Has a Gun", "Miller Harris", "L'Artisan Parfumeur", "Frapin",
    "Arquiste", "Escentric Molecules", "Heeley", "Floraiku", "Keiko Mecheri",
    "Laboratorio Olfattivo", "Lubin", "M.Micallef", "Majda Bekkali", "Moresque",
    "Neela Vermeire", "Ormonde Jayne", "Parfums MDCI", "Perris Monte Carlo", "Projet Alternative",
    "Robert Piguet", "Rothschild", "SHL 777", "Six Scents", "Stephane Humbert Lucas",
    "The House of Oud", "The Merchant of Venice", "Von Eusersdorff", "Widian", "Xerjoff",
    "Abel", "Acca Kappa", "Acqua dell'Elba", "Aedes de Venustas", "Affinessence",
    "Alyson Oldoini", "Angela Ciampagna", "Annick Goutal", "Antonio Alessandria", "April Aromatics",
    "Areej Le Doré", "Armaf", "Atelier des Ors", "Berdoues", "Bois 1920", "Croxatto"
];


const VideosSection = ({ latestVideo, videos }) => {
    // Estados locales para el ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // Manejador de ordenamiento
    const handleSort = (key) => {
        setSortConfig(prev => {
            let direction = "asc";
            if (prev.key === key && prev.direction === "asc") {
                direction = "desc";
            }
            return { key, direction };
        });
    };

    // Función para resaltar marcas
    const highlightBrands = (title) => {
        let result = title;
        PERFUME_BRANDS.forEach(brand => {
            const regex = new RegExp(brand, 'gi');
            result = result.replace(regex, `<strong>${brand}</strong>`);
        });
        return <span dangerouslySetInnerHTML={{ __html: result }} />;
    };

    // Generar la lista de videos ordenada
    const sortedVideos = useMemo(() => {
        if (!sortConfig.key) return videos;

        const { key, direction } = sortConfig;
        return [...videos].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [videos, sortConfig]);

    return (
        <>
            {latestVideo && (
                <div style={{
                    flex: "0.5",
                    padding: "1rem",
                    borderRadius: "8px",
                    background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}>
                    <h3>Último Video</h3>
                    <iframe
                        width="100%"
                        height="315"
                        src={`https://www.youtube.com/embed/${latestVideo.videoId}`}
                        title={latestVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    <p style={{ marginTop: "1rem" }}>
                        {highlightBrands(latestVideo.title)}
                    </p>
                </div>
            )}

            <div style={{
                flex: "1.2",
                padding: "1rem",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}>
                <h3>Últimos Videos</h3>
                {videos.length === 0 ? (
                    <p>Analiza un canal para ver la información de los últimos vídeos.</p>
                ) : (
                    <>
                        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: "#e9e9e9" }}>
                                <tr>
                                    <th onClick={() => handleSort("title")} style={{ cursor: "pointer", padding: "0.5rem" }}>Título</th>
                                    <th onClick={() => handleSort("published_date")} style={{ cursor: "pointer", padding: "0.5rem" }}>Fecha</th>
                                    <th onClick={() => handleSort("views")} style={{ cursor: "pointer", padding: "0.5rem" }}>Vistas</th>
                                    <th onClick={() => handleSort("likes")} style={{ cursor: "pointer", padding: "0.5rem" }}>Likes</th>
                                    <th onClick={() => handleSort("comments_count")} style={{ cursor: "pointer", padding: "0.5rem" }}>Comentarios</th>
                                    <th onClick={() => handleSort("average_stars")} style={{ cursor: "pointer", padding: "0.5rem" }}>Valoración Media</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedVideos.map((video, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: "0.5rem" }}>
                                            <a 
                                                href={`https://www.youtube.com/watch?v=${video.videoId}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                style={{ textDecoration: "none", color: "#333" }}
                                            >
                                                {highlightBrands(video.title)}
                                            </a>
                                        </td>
                                        <td style={{ padding: "0.5rem" }}>
                                            {new Date(video.published_date).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "0.5rem" }}>{video.views}</td>
                                        <td style={{ padding: "0.5rem" }}>{video.likes}</td>
                                        <td style={{ padding: "0.5rem" }}>{video.comments_count}</td>
                                        <td style={{ padding: "0.5rem" }}>
                                            {typeof video.average_stars === "number"
                                                ? video.average_stars.toFixed(2)
                                                : "N/A"
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p style={{
                            marginTop: "1rem",
                            fontSize: "0.9rem",
                            color: "#333",
                            fontStyle: "italic",
                        }}>
                            Esta tabla muestra los 10 últimos vídeos del canal. Las marcas objetivo están en negrita. Puede ordenarse de forma ascendente o descendiente 
                            clicando sobre Título, Fecha, Visitas, Likes, Comentarios y Valoración Media.
                            La valoración media se ha generado usando un modelo de análisis de sentimiento 
                            a partir de los últimos 25 comentarios en el vídeo.
                        </p>
                    </>
                )}
            </div>
        </>
    );
};

export default VideosSection;
