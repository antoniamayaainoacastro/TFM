import React from "react";

const ChannelInfo = ({ channelTitle, description }) => {
    return (
        <div style={{
            flex: "1",
            padding: "1rem",
            borderRadius: "8px",
            background: "linear-gradient(to bottom, #f7f7f7, #d4d4d4)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}>
            <h2>Canal: {channelTitle}</h2>
            <h3>Descripción:</h3>
            <p>{description}</p>

            <p style={{
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: "#333",
                fontStyle: "italic",
            }}>
                Descripción del canal de YouTube analizado.
            </p>
        </div>
    );
};

export default ChannelInfo;
