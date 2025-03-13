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

// Registriere die benötigten Chart.js-Komponenten
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
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

  // Berechne die dynamische obere Grenze der Y-Achse (+20 % des Höchstwerts)
  const maxValue = Math.max(...data.values, 0); // Höchster Wert in den Daten
  const minValue = Math.min(...data.values.filter(val => val > 0), maxValue); // Kleinster positiver Wert
  const buffer = maxValue * 0.20; // 20 % Puffer über dem Höchstwert
  const maxScale = Math.ceil((maxValue + buffer) / 10) * 10; // Nächster 10er-Schritt über dem Maximum

  // Passe die Schrittgröße dynamisch an die Daten an
  let stepSize: number;
  if (maxScale <= 10) {
    stepSize = 2; // Kleinere Schritte für kleine Werte (z. B. quartalsweise Daten)
  } else if (maxScale <= 50) {
    stepSize = 5; // Mittlere Schritte für mittlere Werte
  } else {
    stepSize = 50; // Größere Schritte für große Werte (z. B. jährliche Daten)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Ermöglicht bessere Anpassung an den Container
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0, // Kann optional auf minValue gesetzt werden, z. B. min: Math.floor(minValue / 5) * 5
        max: maxScale, // Dynamische obere Grenze mit 20 % Puffer
        title: {
          display: true,
          text: 'Revenue (Billions)',
        },
        ticks: {
          callback: (value: number) => `${value}B`, // Anzeige in Milliarden
          stepSize: stepSize, // Dynamische Schrittgröße
        },
      },
      x: {
        title: {
          display: true,
          text: 'Year',
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;