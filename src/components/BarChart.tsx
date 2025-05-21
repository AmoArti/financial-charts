// src/components/BarChart.tsx (Angepasst mit React.forwardRef)
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
  ChartOptions,
  Chart // Wichtig für den Ref-Typ
} from 'chart.js';
import { MultiDatasetStockData } from '../hooks/useStockData'; // Passe den Pfad an, falls nötig

// Registriere die benötigten Chart.js Komponenten
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props Interface (exportieren, damit es von anderen Komponenten genutzt werden kann)
export interface BarChartProps {
  data: MultiDatasetStockData;
  title: string; // Wird oft für interne Zwecke oder Fallbacks genutzt, nicht direkt im Chart angezeigt
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
}

// Typ für den Ref, der von react-chartjs-2 für ein Bar-Chart kommt
export type BarChartComponentRef = Chart<"bar", number[], string | number>;


const BarChart = React.forwardRef<BarChartComponentRef | null, BarChartProps>(
  ({ data, title, yAxisFormat = 'number', yAxisLabel }, ref) => {

    const datasetColors = [
      { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },   // Blau
      { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },   // Gelb
      { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },   // Rot
      { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },   // Grün
    ];

    const chartDatasets = (data.datasets || []).map((ds, index) => ({
      label: ds.label,
      data: ds.values || [],
      backgroundColor: datasetColors[index % datasetColors.length].bg,
      borderColor: datasetColors[index % datasetColors.length].border,
      borderWidth: 1,
    }));

    const chartData = {
      labels: data?.labels || [],
      datasets: chartDatasets,
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, },
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
                      } else {
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
                } else { return numValue.toString(); }
              },
          },
        },
        x: { stacked: false },
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