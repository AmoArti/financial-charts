// src/components/ExpandedChartModal.tsx (Download-Button Position angepasst)
import React, { useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent
} from '@ionic/react';
import { closeOutline, downloadOutline } from 'ionicons/icons';
import BarChart, { BarChartComponentRef, BarChartProps } from './BarChart';
import { MultiDatasetStockData } from '../hooks/useStockData';
import './ExpandedChartModal.css';

interface ExpandedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartTitle?: string | null;
  chartData?: MultiDatasetStockData | null;
  yAxisFormat?: BarChartProps['yAxisFormat'];
  yAxisLabel?: string;
}

const ExpandedChartModal: React.FC<ExpandedChartModalProps> = ({
  isOpen,
  onClose,
  chartTitle,
  chartData,
  yAxisFormat,
  yAxisLabel,
}) => {
  const chartRef = useRef<BarChartComponentRef | null>(null);

  const handleExportChart = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current;
      if (chartInstance && typeof chartInstance.toBase64Image === 'function') {
        const imageBase64 = chartInstance.toBase64Image();
        const link = document.createElement('a');
        link.href = imageBase64;
        const safeTitle = chartTitle?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'chart';
        link.download = `${safeTitle}_export.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error("Chart Instanz oder toBase64Image Methode nicht gefunden.", chartInstance);
      }
    } else {
      console.error("Chart Ref ist nicht gesetzt.");
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      cssClass="expanded-chart-modal-custom"
    >
      <IonHeader>
        <IonToolbar>
          {/* Titel bleibt im Standard-Slot (mittig oder links, je nach Theme/Mode) */}
          <IonTitle>{chartTitle || 'Chart Detail'}</IonTitle>
          {/* Beide Buttons jetzt im slot="end" */}
          <IonButtons slot="end">
            {/* Export Button zuerst, damit er links vom Schließen-Button erscheint */}
            <IonButton onClick={handleExportChart} fill="clear" aria-label="Export Chart">
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
            <IonButton onClick={onClose} fill="clear">
              <IonIcon slot="icon-only" icon={closeOutline} aria-label="Schließen" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {chartData && chartData.labels && chartData.labels.length > 0 && chartData.datasets.length > 0 && chartData.datasets.some(ds => ds.values?.length > 0) ? (
          <div className="chart-container-in-modal">
            <BarChart
              ref={chartRef}
              data={chartData}
              title={chartTitle || ''}
              yAxisFormat={yAxisFormat}
              yAxisLabel={yAxisLabel}
            />
          </div>
        ) : (
          <div className="fallback-text-container">
            <p>Keine Daten zum Anzeigen vorhanden oder Chart wird geladen.</p>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ExpandedChartModal;