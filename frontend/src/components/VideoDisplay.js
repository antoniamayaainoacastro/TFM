import React from 'react';
import { PERFUME_BRANDS } from '../constants';

const VideoDisplay = ({ latestVideo }) => {
    const highlightBrands = (title) => {
        let result = title;
        PERFUME_BRANDS.forEach(brand => {
            const regex = new RegExp(brand, 'gi');
            result = result.replace(regex, `<strong>${brand}</strong>`);
        });
        return <span dangerouslySetInnerHTML={{ __html: result }} />;
    };

    if (!latestVideo) {
        return null;
    }

    return (
        <div className="card" style={{ flex: '0.5' }}>
            <h3 className="card-title">Último Video</h3>
            <div className="mb-md">
                <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${latestVideo.videoId}`}
                    title={latestVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-md"
                />
            </div>
            <p className="mt-md text-primary">{highlightBrands(latestVideo.title)}</p>
        </div>
    );
};

export default VideoDisplay;