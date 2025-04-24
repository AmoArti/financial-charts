// src/components/BarChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js'; // ChartOptions hinzugefügt
// Importiere die neue Datenstruktur
import { MultiDatasetStockData } from '../hooks/useStockData'; // Passe Pfad ggf. an

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props Interface angepasst
interface BarChartProps {
  data: MultiDatasetStockData; // Verwende die neue Struktur
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {

  // Farben für die Datasets (ähnlich dem Screenshot)
  const datasetColors = [
    { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },   // Blau (z.B. Revenue)
    { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },   // Gelb (z.B. Gross Profit)
    { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },   // Rot (z.B. Operating Income)
    { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },   // Grün (z.B. Net Income)
  ];

  // Mappe die Datasets aus den Props in das Chart.js Format
  const chartDatasets = data.datasets.map((ds, index) => ({
    label: ds.label,
    data: ds.values,
    backgroundColor: ds.backgroundColor || datasetColors[index % datasetColors.length].bg,
    borderColor: ds.borderColor || datasetColors[index % datasetColors.length].border,
    borderWidth: 1,
  }));

  // Berechnung der Skalierung über *alle* Datasets
  const allValues = data.datasets.flatMap(ds => ds.values).filter(v => typeof v === 'number' && !isNaN(v)); // Sicherstellen, dass nur gültige Zahlen betrachtet werden
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0); // Negative Werte für Income erlauben
  const buffer = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1; // 10% Puffer

  // Skalierungslogik angepasst
  const maxScale = maxValue > 0 ? Math.ceil((maxValue + buffer) / 5) * 5 : (minValue < -5 ? 0 : 5); // Sorge dafür, dass 0 sichtbar ist, wenn es negative Werte gibt
  const minScale = minValue < 0 ? Math.floor((minValue - buffer) / 5) * 5 : 0;

  const range = maxScale - minScale;
  // Schrittgröße - sorge für sinnvolle Schritte, vermeide 0
  let stepSize = range > 0 ? Math.max(1, Math.ceil(range / 10 / 5) * 5) : 5; // Teile durch 10 für max ~10 Ticks, nicht 50
   if (stepSize === 0) stepSize = 5; // Fallback


  // Chart Daten Objekt
  const chartData = {
    labels: data?.labels || [],
    datasets: chartDatasets, // Verwende die gemappten Datasets
  };

  // Chart Optionen angepasst
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        mode: 'index', // Zeige Tooltip für alle Balken eines Index (Quartal)
        intersect: false,
         callbacks: { // Tooltip formatieren
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    // Formatiere als Milliarden, behalte Vorzeichen bei
                    label += `$${context.parsed.y.toFixed(2)}B`;
                }
                return label;
            }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: minValue >= 0, // Dynamisch setzen
        min: minScale,
        max: maxScale,
        title: {
          display: true, // Y-Achsen Titel anzeigen
          text: 'Billions ($B)', // Text für Y-Achse
        },
        ticks: {
           stepSize: stepSize, // Berechnete Schrittgröße
           callback: (value: number | string) => {
             const numValue = typeof value === 'number' ? value : parseFloat(value);
             if (isNaN(numValue)) return value;
             // Formatierung beibehalten ($XB)
             return `$${numValue.toFixed(numValue === 0 ? 0 : 1)}B`;
           },
        },
      },
      x: {
        title: {
          display: false, // X-Achsen Titel nicht anzeigen
        },
         stacked: false, // Sicherstellen, dass Bars gruppiert sind (default)
      },
    },
  };

  // Rendere nur, wenn Labels vorhanden sind
  return (data?.labels?.length > 0 && data?.datasets?.length > 0) ? <Bar data={chartData} options={options} /> : null;
};

export default BarChart;