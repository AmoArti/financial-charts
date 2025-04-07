// src/components/ChartModal.tsx
import React, { useRef } from 'react';
import { IonModal, IonContent, IonSpinner } from '@ionic/react'; // IonSpinner importieren
import ModalHeader from './ModalHeader';
import BarChart from './BarChart';
import { StockData } from '../hooks/useStockData';
import { filterDataToYears } from '../utils/utils';

interface ChartModalProps {
  isOpen: boolean; onClose: () => void; title: string;
  annualData: StockData; quarterlyData: StockData;
  isAnnualView: boolean; setIsAnnualView: (isAnnual: boolean) => void;
  years: number; setYears: (years: number) => void;
  // Ersetze loading/maxYearsFetched durch isFetchingMoreYears
  isFetchingMoreYears: boolean; // NEU: Flag vom Home
}

const ChartModal: React.FC<ChartModalProps> = ({
  isOpen, onClose, title, annualData, quarterlyData,
  isAnnualView, setIsAnnualView, years, setYears,
  isFetchingMoreYears // Empfange das Flag
}) => {
  const modalRef = useRef<HTMLIonModalElement>(null);

  // Daten filtern (unverändert)
  const rawData = isAnnualView ? annualData : quarterlyData;
  const pointsToKeep = isAnnualView ? years : years * 4;
  const filteredDisplayData = filterDataToYears(rawData, pointsToKeep);

  // Dynamischen Key erzeugen (unverändert)
  const chartKey = `${title}-${isAnnualView}-${years}-${filteredDisplayData.labels?.length}-${filteredDisplayData.values?.[0]}-${filteredDisplayData.values?.[filteredDisplayData.values.length - 1]}`;

  // Spinner-Bedingung verwendet jetzt direkt das Flag
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
          {/* Bedingtes Rendern: Spinner oder Chart/Text */}
          {showLoadingSpinner ? ( // Verwende direkt das Flag
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <IonSpinner name="crescent" />
              <p style={{ marginTop: '10px' }}>Lade mehr Daten...</p>
            </div>
          ) : filteredDisplayData.labels.length > 0 ? (
            <BarChart
              key={chartKey} // key bleibt wichtig
              data={filteredDisplayData}
              title={`${title} (${isAnnualView ? 'Annual' : 'Quarterly'})`}
            />
          ) : (
            // Zeige Text, wenn nicht geladen wird, aber keine Daten da sind
            <p>Keine Daten für diesen Zeitraum verfügbar.</p>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ChartModal;