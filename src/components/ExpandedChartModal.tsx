// src/components/ExpandedChartModal.tsx
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
  IonSpinner // Für den Ladezustand im Modal
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import BarChart from './BarChart'; // Importiere deine BarChart Komponente
import { MultiDatasetStockData } from '../hooks/useStockData'; // Importiere den Typ

// Interface für die Props der Komponente
interface ExpandedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartTitle?: string | null;
  chartData?: MultiDatasetStockData | null;
  // Props für die Y-Achsen-Konfiguration des BarCharts
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
  // Optional: Loading-Status, falls das Modal eigene Daten laden würde (hier nicht der Fall)
  // loading?: boolean;
}

const ExpandedChartModal: React.FC<ExpandedChartModalProps> = ({
  isOpen,
  onClose,
  chartTitle,
  chartData,
  yAxisFormat,
  yAxisLabel,
  // loading = false // Default für optionalen Prop
}) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose} // Wird aufgerufen, wenn das Modal durch Swipe etc. geschlossen wird
      // Optional: CSS-Klasse für benutzerdefiniertes Modal-Styling aus Home.css
      // cssClass="custom-chart-modal"
    >
      <IonHeader>
        <IonToolbar>
          {/* Zeige den Titel des Charts im Modal-Header an */}
          <IonTitle>{chartTitle || 'Chart Detail'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} fill="clear">
              <IonIcon slot="icon-only" icon={closeOutline} aria-label="Schließen" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Prüfe, ob Chart-Daten vorhanden sind */}
        {chartData && chartData.labels && chartData.labels.length > 0 && chartData.datasets.length > 0 && chartData.datasets[0].values.length > 0 ? (
          // Container für den BarChart, damit er den Platz gut ausnutzt
          <div style={{ width: '100%', height: 'calc(100% - 16px)', display: 'flex', flexDirection: 'column' }}> {/* 16px für Padding */}
            <BarChart
              data={chartData}
              title={chartTitle || ''} // BarChart.tsx verwendet dies intern nicht direkt als sichtbaren Titel
              yAxisFormat={yAxisFormat}
              yAxisLabel={yAxisLabel}
            />
          </div>
        ) : (
          // Fallback, wenn keine Daten vorhanden sind (oder während des Ladens, falls loading prop genutzt wird)
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {/* {loading ? <IonSpinner /> : <p>Keine Daten zum Anzeigen vorhanden.</p>} */}
            <p>Keine Daten zum Anzeigen vorhanden oder Chart wird geladen.</p>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ExpandedChartModal;