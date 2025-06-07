// src/components/BarChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement, // HINZUGEFÜGT für Linien-Charts
  PointElement, // HINZUGEFÜGT für Punkte auf der Linie
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Chart // Wichtig für den Ref-Typ
} from 'chart.js';
import { MultiDatasetStockData } from '../hooks/useStockData';

// Registriere die benötigten Chart.js Komponenten
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement, // HINZUGEFÜGT
  PointElement, // HINZUGEFÜGT
  Title,
  Tooltip,
  Legend
);

export interface BarChartProps {
  data: MultiDatasetStockData;
  title: string;
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
}

export type BarChartComponentRef = Chart<"bar" | "line", number[], string | number>; // Erweitert für gemischte Typen

const BarChart = React.forwardRef<BarChartComponentRef | null, BarChartProps>(
  ({ data, title, yAxisFormat = 'number', yAxisLabel }, ref) => {

    const datasetColors = [
      // Farben für Balken (Reported EPS, Revenue, etc.)
      { bg: 'rgba(54, 162, 235, 1)', border: 'rgba(54, 162, 235, 1)' },   // Blau
      { bg: 'rgba(255, 99, 132, 1)', border: 'rgba(255, 99, 132, 1)' },   // Rot
      { bg: 'rgba(75, 192, 192, 1)', border: 'rgba(75, 192, 192, 1)' },   // Türkis
      { bg: 'rgba(153, 102, 255, 1)', border: 'rgba(153, 102, 255, 1)' }, // Lila
      { bg: 'rgba(255, 159, 64, 1)', border: 'rgba(255, 159, 64, 1)' },  // Orange
    ];
    
    // Rote Farbe explizit definieren
    const redColor = { bg: 'rgba(255, 99, 132, 1)', border: 'rgba(255, 99, 132, 1)' };

    const chartDatasets = (data.datasets || []).map((ds, index) => {
        // --- KORREKTUR HIER: Gezielte Farbzuweisung ---
        const isEstimated = ds.label.toLowerCase().includes('estimated');
        const color = isEstimated ? redColor : datasetColors[index % datasetColors.length];

        return {
            label: ds.label,
            data: ds.values || [],
            borderWidth: 1.5,
            type: 'bar' as const,
            backgroundColor: ds.backgroundColor || color.bg,
            borderColor: ds.borderColor || color.border,
        };
    });

    const chartData = {
      labels: data?.labels || [],
      datasets: chartDatasets,
    };

    const options: ChartOptions<"bar" | "line"> = { // Erweitert für gemischte Typen
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true, // Verwendet Punkt-Stil in der Legende für Linien
          }
        },
        title: { display: false, text: title },
        tooltip: {
          mode: 'index', intersect: false,
            callbacks: {
              label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) { label += ': '; }
                  if (context.parsed.y !== null) {
                      const value = context.parsed.y;
                      if (yAxisFormat === 'currency') {
                          label += `$${value.toFixed(2)}B`;
                      } else if (yAxisFormat === 'percent') {
                          label += `${value.toFixed(2)}%`;
                      } else if (yAxisFormat === 'ratio') {
                           label += value.toFixed(2);
                      } else { // number (für EPS)
                          label += value.toFixed(2); // Zeige EPS immer mit 2 Nachkommastellen
                      }
                  }
                  return label;
              }
          }
        },
      },
      scales: {
        y: {
          grace: 0.1,
          title: { display: !!yAxisLabel, text: yAxisLabel ?? '' },
          ticks: {
              callback: (value: number | string) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                if (isNaN(numValue)) return value;
                if (yAxisFormat === 'currency') {
                    return `$${numValue.toFixed(numValue % 1 !== 0 ? 1 : 0)}B`;
                } else if (yAxisFormat === 'percent') {
                    return `${numValue.toFixed(numValue !== 0 && numValue % 1 !== 0 ? 1 : 0)}%`;
                } else if (yAxisFormat === 'ratio') {
                    return numValue.toFixed(2);
                } else { // number (für EPS)
                    return numValue.toFixed(2); // Zeige EPS immer mit 2 Nachkommastellen
                }
              },
          },
        },
        x: {
          stacked: false,
        },
      },
    };

    const hasDataToShow = data?.labels?.length > 0 &&
                          data?.datasets?.length > 0 &&
                          data.datasets.some(ds => ds.values?.length > 0);

    return hasDataToShow ? <Bar ref={ref} data={chartData} options={options} /> : null;
  }
);

BarChart.displayName = 'BarChart';
export default BarChart;