// src/components/BarChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: {
    labels: (string | number)[];
    values: number[];
  };
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  // Berechnung der maximalen und minimalen Werte
  const maxValue = Math.max(...data.values, 0);
  const minValue = Math.min(...data.values, 0);
  
  // Dynamische Berechnung von maxScale und minScale mit Puffer
  const buffer = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1; // 10% Puffer
  const maxScale = maxValue > 0 ? Math.ceil((maxValue + buffer) / 2) * 2 : 2; // Rundet auf die nächste gerade Zahl
  const minScale = minValue < 0 ? Math.floor((minValue - buffer) / 2) * 2 : 0; // Rundet ab für negative Werte

  // Berechnung der Schrittgröße basierend auf dem Wertebereich
  const range = maxScale - minScale;
  const stepSize = Math.max(2, Math.ceil(range / 5)); // Mindestens 2, aber an den Bereich angepasst

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.values,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title },
    },
    scales: {
      y: {
        beginAtZero: true, // Startet bei 0, aber minScale kann dies überschreiben
        min: minScale, // Dynamischer Minimalwert (kann negativ sein)
        max: maxScale, // Dynamisches Maximum mit Puffer
        title: {
          display: true,
          text: title.includes('EPS') ? 'EPS ($)' : 'Revenue (Billions $)',
        },
        ticks: {
          stepSize: stepSize, // Dynamische Schrittgröße für gleichmäßige Abstände
          callback: (value: number) => {
            if (title.includes('EPS')) {
              return `$${value}`; // Fügt $ vor EPS-Werte hinzu
            } else {
              return `$${value}B`; // Fügt $ vor Umsatzwerten hinzu
            }
          },
        },
      },
      x: { title: { display: true, text: 'Year' } },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;