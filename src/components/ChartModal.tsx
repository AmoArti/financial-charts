// src/components/ChartModal.tsx
import React, { useRef } from 'react';
import { IonModal, IonContent, IonSpinner } from '@ionic/react';
import ModalHeader from './ModalHeader';
import BarChart from './BarChart';
// Importiere die neue Datenstruktur
import { MultiDatasetStockData } from '../hooks/useStockData';
// filterDataToYears wird hier nicht mehr benötigt, wenn im Hook gefiltert wird
// import { filterDataToYears } from '../utils/utils';

// Props Interface angepasst
interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // Verwende die neue Struktur für die Daten
  annualData: MultiDatasetStockData;
  quarterlyData: MultiDatasetStockData;
  // Restliche Props bleiben gleich
  isAnnualView: boolean;
  setIsAnnualView: (isAnnual: boolean) => void;
  years: number;
  setYears: (years: number) => void;
  isFetchingMoreYears: boolean;
}

const ChartModal: React.FC<ChartModalProps> = ({
  isOpen, onClose, title, annualData, quarterlyData,
  isAnnualView, setIsAnnualView, years, setYears,
  isFetchingMoreYears
}) => {
  const modalRef = useRef<HTMLIonModalElement>(null);

  // Wähle die anzuzeigenden Daten basierend auf der Ansicht
  const displayData = isAnnualView ? annualData : quarterlyData;

  // Interne Filterung hier entfernen - Annahme: Daten sind bereits im Hook gefiltert/getrimmt
  // const pointsToKeep = isAnnualView ? years : years * 4;
  // const filteredDisplayData = filterDataToYears(rawData, pointsToKeep); // <-- ENTFERNEN

  // Dynamischen Key erzeugen (ggf. anpassen, falls nötig)
  const chartKey = `${title}-${isAnnualView}-${years}-${displayData.labels?.length}-${displayData.datasets?.[0]?.values?.[0]}`;

  // Spinner-Bedingung bleibt gleich
  const showLoadingSpinner = isFetchingMoreYears;

  return (
    <IonModal ref={modalRef} isOpen={isOpen} onDidDismiss={onClose} className="custom-modal">
      <IonContent className="ion-padding">
        <ModalHeader
          years={years} setYears={setYears}
          isAnnualView={isAnnualView} setIsAnnualView={setIsAnnualView}
          onClose={onClose}
        />
        <div className="modal-chart-container">
          {showLoadingSpinner ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <IonSpinner name="crescent" />
              <p style={{ marginTop: '10px' }}>Lade mehr Daten...</p>
            </div>
          ) : displayData.labels.length > 0 && displayData.datasets.length > 0 ? ( // Prüfe auch datasets
            <BarChart
              key={chartKey}
              // Übergebe die ausgewählten Daten direkt an BarChart
              data={displayData}
              title={`${title} (${isAnnualView ? 'Annual' : 'Quarterly'})`}
            />
          ) : (
            <p>Keine Daten für diesen Zeitraum verfügbar.</p>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ChartModal;