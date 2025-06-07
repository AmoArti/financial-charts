// src/components/InteractiveChart.tsx
import React, { useState } from 'react';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import BarChart from './BarChart';
import { StockData } from '../types/stockDataTypes';
import './InteractiveChart.css';

// Interface für die Props der Komponente
interface InteractiveChartProps {
  // Wir übergeben ein Objekt, das die verschiedenen Datenansichten enthält
  chartDataSets: {
    quarterly: StockData;
    ttm: StockData;
    // Hier könnten später weitere hinzukommen, z.B. fcfPerShare, etc.
  };
  title: string;
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  chartDataSets,
  title,
  yAxisFormat,
  yAxisLabel,
}) => {
  // State, um die aktuelle Ansicht (Quarterly vs. TTM) zu steuern
  const [currentView, setCurrentView] = useState<'quarterly' | 'ttm'>('ttm');

  const handleViewChange = (e: any) => {
    const newView = e.detail.value;
    if (newView) {
      setCurrentView(newView);
    }
  };

  // Wähle das richtige Datenset basierend auf dem State aus
  const activeData = chartDataSets[currentView];

  // Wandle die StockData (Ein-Dataset) in MultiDatasetStockData um für den BarChart
  const chartDataForBarComponent = {
    labels: activeData?.labels || [],
    datasets: [
      {
        label: `${title} (${currentView.toUpperCase()})`,
        values: activeData?.values || [],
      },
    ],
  };

  const hasData = activeData && activeData.labels.length > 0 && activeData.values.length > 0;

  return (
    <div className="interactive-chart-container">
      <div className="interactive-chart-header">
        <h3 className="interactive-chart-title">{title}</h3>
        <IonSegment
          value={currentView}
          onIonChange={handleViewChange}
          className="interactive-chart-segment"
        >
          <IonSegmentButton value="quarterly">
            <IonLabel>Quarterly</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ttm">
            <IonLabel>TTM</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>
      <div className="interactive-chart-content">
        {hasData ? (
          <BarChart
            data={chartDataForBarComponent}
            title={title} // Titel wird im Chart selbst nicht mehr angezeigt, aber für props benötigt
            yAxisFormat={yAxisFormat}
            yAxisLabel={yAxisLabel}
          />
        ) : (
          <p className="no-data-message">Keine Daten für diese Ansicht verfügbar.</p>
        )}
      </div>
    </div>
  );
};

export default InteractiveChart;