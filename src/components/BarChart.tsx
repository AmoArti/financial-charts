// src/components/BarChart.tsx
import React, { ForwardedRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement, 
  PointElement, 
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Chart
} from 'chart.js';
import { MultiDatasetStockData } from '../types/stockDataTypes';

// Registriere die benötigten Chart.js Komponenten
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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

export type BarChartComponentRef = Chart<"bar" | "line", number[], string | number>;

const BarChart = React.forwardRef<BarChartComponentRef | null, BarChartProps>(
  ({ data, title, yAxisFormat = 'number', yAxisLabel }, ref: ForwardedRef<BarChartComponentRef | null>) => {

    const datasetColors = [
      { bg: '#2287f5', border: '#2287f5' },                            // Blau
      { bg: '#ffc600', border: '#ffc600' },                            // Gelb
      { bg: '#ff4b3b', border: '#ff4b3b' },                            // Rot
      { bg: '#00d290', border: '#00d290' },                            // Grün
      { bg: 'rgba(153, 102, 255, 1)', border: 'rgba(153, 102, 255, 1)' }, // Lila (Fallback)
    ];
    
    const estimatedColor = { bg: 'rgba(255, 75, 59, 0.7)', border: 'rgba(255, 75, 59, 0.7)' };

    const chartDatasets = (data.datasets || []).map((ds: { label: string; values: number[]; backgroundColor?: string; borderColor?: string; }, index: number) => {
        const isEstimated = ds.label.toLowerCase().includes('estimated');
        
        const color = isEstimated ? estimatedColor : datasetColors[index % datasetColors.length];

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

    const options: ChartOptions<"bar" | "line"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: false, 
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
                          label += value.toFixed(2);
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
          title: { display: false, text: yAxisLabel ?? '' },
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
                    return numValue.toFixed(2);
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
                          data.datasets.some((ds: { values: number[] }) => ds.values?.length > 0);

    return hasDataToShow ? <Bar ref={ref} data={chartData} options={options} /> : null;
  }
);

BarChart.displayName = 'BarChart';
export default BarChart;