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
        title: {
          display: true,
          text: 'Revenue (Billions)', // Y-Achsen-Beschriftung
        },
        ticks: {
          callback: (value) => `${value}B`, // Anzeige in Milliarden
        },
      },
      x: {
        title: {
          display: true,
          text: 'Year', // X-Achsen-Beschriftung
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;