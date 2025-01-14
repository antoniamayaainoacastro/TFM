import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const ChannelComparison = ({ currentChannelData }) => {
  const [comparisonUrl, setComparisonUrl] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Debug logging function
  const debugLog = (message, data) => {
    console.log(`[ChannelComparison] ${message}:`, data);
  };

  const parsePerfumeData = (rawData) => {
    let perfumes = null;
    try {
      // If analysis is a string, parse it
      if (typeof rawData === 'string') {
        let cleanData = rawData
          .replace(/\\n/g, '')
          .replace(/\\"/g, '"')
          .replace(/"{/g, '{')
          .replace(/}"/g, '}')
          .replace(/\\/g, '');
        rawData = JSON.parse(cleanData);
      }

      if (typeof rawData.analysis === 'string') {
        rawData.analysis = JSON.parse(rawData.analysis);
      }

      if (rawData.analysis?.perfumes) {
        if (typeof rawData.analysis.perfumes === 'string') {
          perfumes = JSON.parse(rawData.analysis.perfumes);
        } else {
          perfumes = rawData.analysis.perfumes;
        }
      } else if (rawData.perfumes) {
        if (typeof rawData.perfumes === 'string') {
          perfumes = JSON.parse(rawData.perfumes);
        } else {
          perfumes = rawData.perfumes;
        }
      }

      return perfumes;
    } catch (err) {
      console.error('Error parsing perfume data:', err);
      return null;
    }
  };

  const fetchComparisonData = async () => {
    setIsLoading(true);
    setError('');
    debugLog('Fetching comparison data for URL', comparisonUrl);

    try {
      const response = await fetch('https://backend-service-320582554125.europe-southwest1.run.app/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: comparisonUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del canal');
      }
      
      let data = await response.json();
      debugLog('Raw API response', data);

      // Parse nested JSON if needed
      if (typeof data === 'string') {
        data = JSON.parse(data);
        debugLog('Parsed string data', data);
      }

      // Process videos array
      if (data.videos && Array.isArray(data.videos)) {
        debugLog('Processing videos array', data.videos);
        
        const processedVideos = data.videos
          .map(video => {
            // Check if the video has a valid date
            const date = new Date(video.published_date);
            if (isNaN(date.getTime())) {
              console.error('Invalid date for video:', video);
              return null;
            }
            return {
              ...video,
              published_date: date.toISOString(),
              // Initially no perfume_analysis here since api/analyze doesn't provide it
              perfume_analysis: null
            };
          })
          .filter(Boolean) // Remove null entries
          .sort((a, b) => new Date(a.published_date) - new Date(b.published_date));

        data.videos = processedVideos;

        debugLog('Processed and sorted videos:', 
          processedVideos.map(v => ({
            date: v.published_date,
            title: v.title
          }))
        );
      }

      setComparisonData(data);
    } catch (err) {
      console.error('Error in fetchComparisonData:', err);
      setError('Error al cargar el canal de comparación');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerfumeAnalysisForVideo = async (videoId) => {
    try {
      const response = await fetch("https://backend-service-320582554125.europe-southwest1.run.app/api/analyze-perfumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_url: `https://www.youtube.com/watch?v=${videoId}` }),
      });
      if (!response.ok) {
        console.warn(`Perfume analysis failed for video: ${videoId}`);
        return null;
      }
      const rawData = await response.json();
      return parsePerfumeData(rawData);
    } catch (error) {
      console.error('Error fetching perfume analysis:', error);
      return null;
    }
  };

  // After we have both channels, fetch perfume data
  useEffect(() => {
    const updatePerfumesData = async () => {
      if (!comparisonData || !currentChannelData) return;
      
      // For demonstration, let's just analyze the first video of each channel
      const currentVideo = currentChannelData?.videos?.[0];
      const comparisonVideo = comparisonData?.videos?.[0];

      if (currentVideo?.videoId) {
        const perfumes = await fetchPerfumeAnalysisForVideo(currentVideo.videoId);
        if (perfumes) {
          currentVideo.perfume_analysis = perfumes;
        }
      }

      if (comparisonVideo?.videoId) {
        const perfumes = await fetchPerfumeAnalysisForVideo(comparisonVideo.videoId);
        if (perfumes) {
          comparisonVideo.perfume_analysis = perfumes;
          setComparisonData({
            ...comparisonData,
            videos: [...comparisonData.videos]
          });
        }
      }
    };
    updatePerfumesData();
  }, [comparisonData, currentChannelData]);

  const getMetricValue = (video, metric) => {
    switch(metric) {
      case 'views': return video?.views || 0;
      case 'likes': return video?.likes || 0;
      case 'comments': return video?.comments_count || 0;
      case 'rating': return video?.average_stars || 0;
      default: return 0;
    }
  };

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!currentChannelData?.videos || !comparisonData?.videos || selectedMetric === 'perfumes') {
      return;
    }

    debugLog('Creating chart with current data', currentChannelData);
    debugLog('and comparison data', comparisonData);

    const standardizeDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString();
    };

    const sortedCurrentVideos = [...currentChannelData.videos]
      .map(video => ({
        ...video,
        published_date: standardizeDate(video.published_date)
      }))
      .sort((a, b) => new Date(a.published_date) - new Date(b.published_date));

    const sortedComparisonVideos = [...comparisonData.videos]
      .map(video => ({
        ...video,
        published_date: standardizeDate(video.published_date)
      }))
      .sort((a, b) => new Date(a.published_date) - new Date(b.published_date));

    debugLog('Sorted current videos', sortedCurrentVideos);
    debugLog('Sorted comparison videos', sortedComparisonVideos);

    const ctx = chartRef.current.getContext('2d');

    const formatDataset = (videos, label, color) => {
      const formattedData = videos.map(video => ({
        x: new Date(video.published_date),
        y: getMetricValue(video, selectedMetric),
        videoId: video.videoId
      }));

      console.log(`Dataset for ${label}:`, formattedData);

      return {
        label,
        data: formattedData,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'),
        tension: 0,
        pointRadius: 6,
        pointHoverRadius: 8
      };
    };

    const chartData = {
      datasets: [
        formatDataset(sortedCurrentVideos, currentChannelData.channel_title, 'rgba(75, 192, 192, 1)'),
        formatDataset(sortedComparisonVideos, comparisonData.channel_title, 'rgba(255, 99, 132, 1)')
      ]
    };

    debugLog('Chart datasets', chartData.datasets);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Comparación de ${
              selectedMetric === 'views' ? 'Visitas' : 
              selectedMetric === 'likes' ? 'Likes' : 
              selectedMetric === 'comments' ? 'Comentarios' : 
              'Valoración Media'
            }`
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
            title: {
              display: true,
              text: 'Fecha'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: selectedMetric === 'views' ? 'Visitas' : 
                    selectedMetric === 'likes' ? 'Likes' : 
                    selectedMetric === 'comments' ? 'Comentarios' : 
                    'Valoración'
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const element = elements[0];
            const dataset = chartData.datasets[element.datasetIndex];
            const videoId = dataset.data[element.index].videoId;
            if (videoId) {
              window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [currentChannelData, comparisonData, selectedMetric]);

  const displayPerfumes = (video, channelTitle) => {
    if (!video) {
      console.log('No video data provided to displayPerfumes');
      return null;
    }

    const perfumes = video.perfume_analysis; 

    return (
      <div style={{
        marginBottom: '2rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>{channelTitle}</h3>
        {perfumes && Array.isArray(perfumes) && perfumes.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '35%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Marca</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Valoración</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Razón</th>
              </tr>
            </thead>
            <tbody>
              {perfumes.map((perfume, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #dee2e6' }}>
                  <td style={{ padding: '0.75rem' }}>{perfume.marca}</td>
                  <td style={{ padding: '0.75rem' }}>{perfume.nombre}</td>
                  <td style={{ padding: '0.75rem' }}>{perfume.descripcion}</td>
                  <td style={{ padding: '0.75rem' }}>{perfume.valoracion}</td>
                  <td style={{ padding: '0.75rem' }}>{perfume.razon || perfume.razon_valoracion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '35%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Marca</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Valoración</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Razón</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ padding: '0.75rem', textAlign: 'center' }}>
                  No hay datos de perfumes disponibles para este canal
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const comparePerfumes = () => {
    console.log('Starting perfume comparison');
    console.log('Current channel data:', currentChannelData);
    console.log('Comparison data:', comparisonData);

    const currentVideo = currentChannelData?.videos?.[0];
    const comparisonVideo = comparisonData?.videos?.[0];

    console.log('Selected videos for perfume analysis:', {
      currentVideo: currentVideo ? {
        id: currentVideo.videoId,
        hasPerfumes: Boolean(currentVideo.perfume_analysis)
      } : null,
      comparisonVideo: comparisonVideo ? {
        id: comparisonVideo.videoId,
        hasPerfumes: Boolean(comparisonVideo.perfume_analysis)
      } : null
    });

    return (
      <div style={{ width: '100%' }}>
        {displayPerfumes(currentVideo, currentChannelData.channel_title)}
        {displayPerfumes(comparisonVideo, comparisonData.channel_title)}
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      margin: '2rem auto',
      padding: '2rem',
      background: 'linear-gradient(to bottom, #f7f7f7, #d4d4d4)',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem'
      }}>
        Comparación de Canales
      </h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem'
      }}>
        <input
          type="text"
          value={comparisonUrl}
          onChange={(e) => setComparisonUrl(e.target.value)}
          placeholder="URL del canal a comparar"
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={fetchComparisonData}
          disabled={isLoading || !comparisonUrl}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading || !comparisonUrl ? 0.7 : 1
          }}
        >
          {isLoading ? 'Cargando...' : 'Comparar'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {comparisonData && (
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem',
          width: '100%'
        }}>
          <div style={{ width: '200px' }}>
            {['views', 'likes', 'comments', 'rating', 'perfumes'].map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: selectedMetric === metric ? '#333' : 'white',
                  color: selectedMetric === metric ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {metric === 'views' && 'Visitas'}
                {metric === 'likes' && 'Likes'}
                {metric === 'comments' && 'Comentarios'}
                {metric === 'rating' && 'Valoración Media'}
                {metric === 'perfumes' && 'Análisis de Perfumes'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {selectedMetric === 'perfumes' ? (
              comparePerfumes()
            ) : (
              <div style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                height: '400px'
              }}>
                <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelComparison;
