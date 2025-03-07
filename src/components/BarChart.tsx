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
    labels: string[]; // z. B. ["Value", "Quality", "Momentum", "Volatility"]
    values: number[]; // z. B. [75, 60, 85, 40]
  };
  title: string; // Titel des Diagramms
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.values,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Farbe der Balken
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
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
        max: 100, // Finanzkennzahlen sind oft auf einer Skala von 0 bis 100
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;