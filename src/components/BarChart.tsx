// src/components/BarChart.tsx
import React from 'react';
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
  ChartData,
  Plugin,
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
  plugins?: Plugin<'bar'>[];
}

// KORREKTUR: Wir exportieren diesen Typ, damit Parent-Komponenten (wie ExpandedChartModal)
// den korrekten Typ für `useRef` haben.
export type BarChartComponentRef = ChartJS<'bar', (number | null)[], string | number>;

// FINALE KORREKTUR: Der erste generische Typ für `forwardRef` muss `undefined` enthalten,
// um mit der Typdefinition von react-chartjs-2 übereinzustimmen.
const BarChart = React.forwardRef<BarChartComponentRef | undefined, BarChartProps>(
  ({ data, title, yAxisFormat = 'number', yAxisLabel }, ref) => {
    const datasetColors = [
      { bg: '#2287f5', border: '#2287f5' },
      { bg: '#ffc600', border: '#ffc600' },
      { bg: '#ff4b3b', border: '#ff4b3b' },
      { bg: '#00d290', border: '#00d290' },
      { bg: 'rgba(153, 102, 255, 1)', border: 'rgba(153, 102, 255, 1)' },
    ];

    const estimatedColor = {
      bg: 'rgba(255, 75, 59, 0.7)',
      border: 'rgba(255, 75, 59, 0.7)',
    };

    const chartDatasets = (data.datasets || []).map((ds, index) => {
      const isEstimated = ds.label.toLowerCase().includes('estimated');
      const color = isEstimated
        ? estimatedColor
        : datasetColors[index % datasetColors.length];
      return {
        label: ds.label,
        data: ds.values || [],
        borderWidth: 1.5,
        type: 'bar' as const,
        backgroundColor: ds.backgroundColor || color.bg,
        borderColor: ds.borderColor || color.border,
      };
    });

    const chartData: ChartData<'bar', (number | null)[], string | number> = {
      labels: data.labels,
      datasets: chartDatasets,
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { usePointStyle: false } },
        title: { display: false, text: title },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                const value = context.parsed.y;
                if (yAxisFormat === 'currency') label += `$${value.toFixed(2)}B`;
                else if (yAxisFormat === 'percent')
                  label += `${value.toFixed(2)}%`;
                else if (yAxisFormat === 'ratio') label += value.toFixed(2);
                else label += value.toFixed(2);
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          grace: 0.1,
          title: { display: false, text: yAxisLabel ?? '' },
          ticks: {
            callback: (value: number | string) => {
              const numValue =
                typeof value === 'number' ? value : parseFloat(String(value));
              if (isNaN(numValue)) return value;
              if (yAxisFormat === 'currency')
                return `$${numValue.toFixed(numValue % 1 !== 0 ? 1 : 0)}B`;
              if (yAxisFormat === 'percent')
                return `${numValue.toFixed(
                  numValue !== 0 && numValue % 1 !== 0 ? 1 : 0
                )}%`;
              return numValue.toFixed(2);
            },
          },
        },
        x: { stacked: false },
      },
    };

    const hasDataToShow =
      data?.labels?.length > 0 &&
      data?.datasets?.length > 0 &&
      data.datasets.some(ds => ds.values?.length > 0);

    return hasDataToShow ? (
      <Bar ref={ref} data={chartData} options={options} />
    ) : null;
  }
);

BarChart.displayName = 'BarChart';
export default BarChart;