import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const ChannelComparison = ({ currentChannelData }) => {
  const [comparisonUrl, setComparisonUrl] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const fetchComparisonData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: comparisonUrl }),
      });
      
      if (!response.ok) throw new Error('Error al obtener datos del canal');
      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError('Error al cargar el canal de comparación');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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

    if (currentChannelData?.videos && comparisonData?.videos && selectedMetric !== 'perfumes') {
      const ctx = chartRef.current.getContext('2d');
      
      const labels = currentChannelData.videos.map(video => 
        new Date(video.published_date).toLocaleDateString()
      );

      const currentChannelValues = currentChannelData.videos.map(video => 
        getMetricValue(video, selectedMetric)
      );

      const comparisonChannelValues = comparisonData.videos.map(video => 
        getMetricValue(video, selectedMetric)
      );

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: currentChannelData.channel_title,
              data: currentChannelValues,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            },
            {
              label: comparisonData.channel_title,
              data: comparisonChannelValues,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `Comparación de ${selectedMetric === 'views' ? 'Visitas' : 
                     selectedMetric === 'likes' ? 'Likes' : 
                     selectedMetric === 'comments' ? 'Comentarios' : 
                     'Valoración Media'}`
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [currentChannelData, comparisonData, selectedMetric]);

  const comparePerfumes = () => {
    if (!currentChannelData?.videos?.[0]?.perfume_analysis || !comparisonData?.videos?.[0]?.perfume_analysis) {
      return null;
    }

    return (
      <div style={{
        marginTop: '1rem',
        overflowX: 'auto',
        background: 'white',
        borderRadius: '8px',
        padding: '1rem'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Canal</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Total Perfumes</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Valoraciones Positivas</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Valoraciones Negativas</th>
            </tr>
          </thead>
          <tbody>
            {[currentChannelData, comparisonData].map((channelData, idx) => {
              const perfumes = channelData.videos[0].perfume_analysis || [];
              const positiveCount = perfumes.filter(p => p.valoracion === "positiva").length;
              
              return (
                <tr key={idx} style={{ borderTop: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem' }}>{channelData.channel_title}</td>
                  <td style={{ padding: '1rem' }}>{perfumes.length}</td>
                  <td style={{ padding: '1rem' }}>{positiveCount}</td>
                  <td style={{ padding: '1rem' }}>{perfumes.length - positiveCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      padding: '2rem',
      background: 'linear-gradient(to bottom, #f7f7f7, #d4d4d4)',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      marginTop: '2rem'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Comparación de Canales
      </h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
        <div style={{ display: 'flex', gap: '1.5rem' }}>
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
                <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelComparison;