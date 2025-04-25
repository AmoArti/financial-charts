// src/components/BarChart.tsx (Mit automatischer Skalierung)
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions, ScriptableContext } from 'chart.js'; // ChartOptions, ScriptableContext hinzugefügt
// Importiere die MultiDatasetStockData Struktur
import { MultiDatasetStockData } from '../hooks/useStockData'; // Passe Pfad ggf. an

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props Interface (unverändert)
interface BarChartProps {
  data: MultiDatasetStockData;
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
  const chartDatasets = (data.datasets || []).map((ds, index) => ({ // Füge Fallback für leeres datasets hinzu
    label: ds.label,
    data: ds.values || [], // Fallback für leere values
    backgroundColor: ds.backgroundColor || datasetColors[index % datasetColors.length].bg,
    borderColor: ds.borderColor || datasetColors[index % datasetColors.length].border,
    borderWidth: 1,
  }));

  // Manuelle Skalierungsberechnung ENTFERNT

  // Chart Daten Objekt
  const chartData = {
    labels: data?.labels || [],
    datasets: chartDatasets, // Verwende die gemappten Datasets
  };

  // Chart Optionen angepasst für automatische Skalierung
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        // Standard-onClick von Chart.js sollte für das Ausblenden/Einblenden ausreichen
      },
      title: {
        display: false,
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
        // beginAtZero: true, // Chart.js macht das meist automatisch korrekt
        grace: 0.1, // Fügt 10% Puffer über dem höchsten sichtbaren Wert hinzu
        title: {
          display: true, // Y-Achsen Titel anzeigen
          text: 'Billions ($B)', // Text für Y-Achse
        },
        ticks: {
           // stepSize entfernt - Chart.js bestimmt Schrittgröße automatisch
           callback: (value: number | string) => { // Formatierung beibehalten
             const numValue = typeof value === 'number' ? value : parseFloat(String(value)); // String Konvertierung für Sicherheit
             if (isNaN(numValue)) return value;
             // Formatierung beibehalten ($XB oder $X.XB)
             return `$${numValue.toFixed(numValue % 1 !== 0 ? 1 : 0)}B`; // Zeige .1 wenn nicht ganze Zahl
           },
        },
      },
      x: {
        title: {
          display: false, // X-Achsen Titel nicht anzeigen
        },
         stacked: false, // Sicherstellen, dass Bars gruppiert sind
      },
    },
    // Stelle sicher, dass das Chart Updates verarbeitet
    // animation: false, // Kann helfen, Probleme zu debuggen
  };

  // Rendere nur, wenn Labels und Datasets vorhanden sind
  return (data?.labels?.length > 0 && data?.datasets?.length > 0) ? <Bar data={chartData} options={options} /> : null;
};

export default BarChart;