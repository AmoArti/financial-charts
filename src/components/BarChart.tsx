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
        beginAtZero: true, // Startet bei 0
        title: {
          display: true,
          text: title.includes('EPS') ? 'EPS' : 'Revenue (Billions)',
        },
        ticks: {
          callback: (value: number) => (title.includes('EPS') ? value : `${value}B`),
        },
      },
      x: { title: { display: true, text: 'Year' } },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;