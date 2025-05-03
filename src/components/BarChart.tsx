// src/components/BarChart.tsx (Mit yAxisFormat = 'ratio' Option)
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { MultiDatasetStockData } from '../hooks/useStockData'; // Passe Pfad ggf. an

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props Interface erweitert für 'ratio'
interface BarChartProps {
  data: MultiDatasetStockData;
  title: string; // Wird für Card-Titel verwendet
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio'; // NEU: 'ratio' hinzugefügt
  yAxisLabel?: string; // Optionaler Titel für die Y-Achse
}

const BarChart: React.FC<BarChartProps> = ({ data, title, yAxisFormat = 'number', yAxisLabel }) => { // Defaults gesetzt

  // Farben für die Datasets (unverändert)
  const datasetColors = [
    { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },   // Blau
    { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },   // Gelb
    { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },   // Rot
    { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },   // Grün
     // Füge bei Bedarf mehr Farben hinzu
  ];

  // Mappe die Datasets (unverändert)
  const chartDatasets = (data.datasets || []).map((ds, index) => ({
    label: ds.label,
    data: ds.values || [],
    backgroundColor: datasetColors[index % datasetColors.length].bg,
    borderColor: datasetColors[index % datasetColors.length].border,
    borderWidth: 1,
  }));

  // Chart Daten Objekt (unverändert)
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
                        label += `$${value.toFixed(2)}B`; // Währung immer mit 2 Nachkommastellen im Tooltip
                    } else if (yAxisFormat === 'percent') {
                        label += `${value.toFixed(2)}%`; // Prozent immer mit 2 Nachkommastellen im Tooltip
                    // *** NEUE Bedingung für Ratio ***
                    } else if (yAxisFormat === 'ratio') {
                         label += value.toFixed(2); // Ratio mit 2 Nachkommastellen
                    // *** Ende NEU ***
                    } else { // Fallback für 'number' oder unbekannt
                        label += value.toString();
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
          display: !!yAxisLabel,
          text: yAxisLabel ?? '',
        },
        ticks: {
            callback: (value: number | string) => { // Dynamische Formatierung
              const numValue = typeof value === 'number' ? value : parseFloat(String(value));
              if (isNaN(numValue)) return value; // Gib Original zurück, wenn keine Zahl

              if (yAxisFormat === 'currency') {
                  // Zeige Nachkommastelle nur wenn nötig (z.B. 1.5B, aber 2B)
                  return `$${numValue.toFixed(numValue % 1 !== 0 ? 1 : 0)}B`;
              } else if (yAxisFormat === 'percent') {
                  // Zeige eine Nachkommastelle für Prozente, außer bei 0 oder ganzen Zahlen
                  return `${numValue.toFixed(numValue !== 0 && numValue % 1 !== 0 ? 1 : 0)}%`;
              // *** NEUE Bedingung für Ratio ***
              } else if (yAxisFormat === 'ratio') {
                  // Immer 2 Nachkommastellen für Ratio auf der Achse
                  return numValue.toFixed(2);
              // *** Ende NEU ***
              } else { // Fallback für 'number'
                  // Normale Zahl ohne spezielle Formatierung (oder spezifische Logik für 'number' hinzufügen)
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