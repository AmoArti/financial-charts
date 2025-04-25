// src/components/BarChart.tsx (Mit Y-Achsen Formatierung)
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { MultiDatasetStockData } from '../hooks/useStockData'; // Passe Pfad ggf. an

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props Interface erweitert
interface BarChartProps {
  data: MultiDatasetStockData;
  title: string; // Wird für Card-Titel verwendet
  yAxisFormat?: 'currency' | 'percent' | 'number'; // Format der Y-Achse
  yAxisLabel?: string; // Optionaler Titel für die Y-Achse
}

const BarChart: React.FC<BarChartProps> = ({ data, title, yAxisFormat = 'number', yAxisLabel }) => { // Defaults gesetzt

  // Farben für die Datasets
  const datasetColors = [
    { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },   // Blau
    { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },   // Gelb
    { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },   // Rot
    { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },   // Grün
     // Füge bei Bedarf mehr Farben hinzu
  ];

  // Mappe die Datasets aus den Props in das Chart.js Format
  const chartDatasets = (data.datasets || []).map((ds, index) => ({
    label: ds.label,
    data: ds.values || [],
    backgroundColor: datasetColors[index % datasetColors.length].bg,
    borderColor: datasetColors[index % datasetColors.length].border,
    borderWidth: 1,
  }));

  // Chart Daten Objekt
  const chartData = {
    labels: data?.labels || [],
    datasets: chartDatasets,
  };

  // Chart Optionen mit dynamischer Y-Achse
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, },
      title: { display: false }, // Interner Titel bleibt aus
      tooltip: {
        mode: 'index', intersect: false,
         callbacks: {
            label: function(context) { // Tooltip anpassen je nach Format
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                    const value = context.parsed.y;
                    if (yAxisFormat === 'currency') {
                        // Annahme: Skalierung in Mrd. passiert im Hook, hier nur Format
                        label += `$${value.toFixed(2)}B`;
                    } else if (yAxisFormat === 'percent') {
                        label += `${value.toFixed(2)}%`; // Prozent mit 2 Nachkommastellen
                    } else {
                        label += value.toString(); // Normale Zahl
                    }
                }
                return label;
            }
        }
      },
    },
    scales: {
      y: {
        grace: 0.1, // 10% Puffer
        title: {
          display: !!yAxisLabel, // Nur anzeigen, wenn Label übergeben wird
          text: yAxisLabel ?? '', // Verwende übergebenes Label
        },
        ticks: {
           callback: (value: number | string) => { // Dynamische Formatierung
             const numValue = typeof value === 'number' ? value : parseFloat(String(value));
             if (isNaN(numValue)) return value;

             if (yAxisFormat === 'currency') {
                 return `$${numValue.toFixed(numValue % 1 !== 0 ? 1 : 0)}B`;
             } else if (yAxisFormat === 'percent') {
                 // Zeige eine Nachkommastelle für Prozente, außer bei 0
                 return `${numValue.toFixed(numValue !== 0 && numValue % 1 !== 0 ? 1 : 0)}%`;
             } else {
                 return numValue.toString();
             }
           },
        },
      },
      x: { stacked: false },
    },
  };

  // Rendere nur, wenn Labels und Datasets vorhanden sind
  return (data?.labels?.length > 0 && data?.datasets?.length > 0) ? <Bar data={chartData} options={options} /> : null;
};

export default BarChart;