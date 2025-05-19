// src/components/ExpandedChartModal.tsx (Mit externer CSS-Datei)
import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import BarChart from './BarChart';
import { MultiDatasetStockData } from '../hooks/useStockData';
import './ExpandedChartModal.css'; // NEU: Importiere die CSS-Datei

// Interface für die Props der Komponente (bleibt gleich)
interface ExpandedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartTitle?: string | null;
  chartData?: MultiDatasetStockData | null;
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
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
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      cssClass="expanded-chart-modal-custom" // NEU: CSS-Klasse zugewiesen
      // Das inline 'style'-Attribut wurde entfernt
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{chartTitle || 'Chart Detail'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} fill="clear">
              <IonIcon slot="icon-only" icon={closeOutline} aria-label="Schließen" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding"> {/* ion-padding für Standard-Abstand */}
        {chartData && chartData.labels && chartData.labels.length > 0 && chartData.datasets.length > 0 && chartData.datasets[0].values.length > 0 ? (
          // Container für den BarChart, jetzt mit Klasse statt Inline-Style
          <div className="chart-container-in-modal">
            <BarChart
              data={chartData}
              title={chartTitle || ''}
              yAxisFormat={yAxisFormat}
              yAxisLabel={yAxisLabel}
            />
          </div>
        ) : (
          // Optional: Verwende eine Klasse für den Fallback-Text-Container
          <div className="fallback-text-container">
            <p>Keine Daten zum Anzeigen vorhanden oder Chart wird geladen.</p>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ExpandedChartModal;