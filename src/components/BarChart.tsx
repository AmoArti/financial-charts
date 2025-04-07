// src/components/BarChart.tsx
import React from 'react'; // useEffect entfernt
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Interface ggf. anpassen oder importieren
interface StockDataForChart { labels: (string | number)[]; values: number[]; }

interface BarChartProps { data: StockDataForChart; title: string; }

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {

  // useEffect Log wurde entfernt

  // Berechnung der Skalierung
  const values = data?.values || [];
  const maxValue = Math.max(...values, 0); const minValue = Math.min(...values, 0);
  const buffer = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1;
  const maxScale = maxValue > 0 ? Math.ceil((maxValue + buffer) / 5) * 5 : 5;
  const minScale = minValue < 0 ? Math.floor((minValue - buffer) / 5) * 5 : 0;
  const range = maxScale - minScale;
  const stepSize = Math.max(5, Math.ceil(range / 50) * 5);

  // Chart Daten
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: title, data: values,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ],
  };

  // Chart Optionen
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const }, title: { display: true, text: title }, },
    scales: {
      y: {
        beginAtZero: minValue >= 0, min: minScale, max: maxScale, title: { display: false },
        ticks: {
          stepSize: stepSize,
          callback: (value: number | string) => {
             const numValue = typeof value === 'number' ? value : parseFloat(value); if (isNaN(numValue)) return value;
             if (title.includes('EPS')) { return `$${numValue.toFixed(2)}`; }
             else { return `$${numValue.toFixed(numValue === 0 ? 0 : 1)}B`; }
          },
        },
      },
      x: { title: { display: false }, },
    },
  };

  return (data?.labels?.length > 0) ? <Bar data={chartData} options={options} /> : null;
};

export default BarChart;