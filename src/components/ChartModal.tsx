// src/components/ChartModal.tsx
import React, { useRef } from 'react'; // useEffect entfernt
import { IonModal, IonContent } from '@ionic/react';
import ModalHeader from './ModalHeader';
import BarChart from './BarChart';
// Importiere den StockData-Typ vom Hook und die neue Filterfunktion
// Stelle sicher, dass StockData auch wirklich exportiert wird in useStockData.ts
import { StockData } from '../hooks/useStockData';
// Annahme: filterDataToYears und StockDataForFilter (oder kompatibler Typ) sind in utils.ts
import { filterDataToYears } from '../utils/utils';

interface ChartModalProps {
  isOpen: boolean; onClose: () => void; title: string;
  annualData: StockData; quarterlyData: StockData;
  isAnnualView: boolean; setIsAnnualView: (isAnnual: boolean) => void;
  years: number; setYears: (years: number) => void;
}

const ChartModal: React.FC<ChartModalProps> = ({
  isOpen, onClose, title, annualData, quarterlyData,
  isAnnualView, setIsAnnualView, years, setYears,
}) => {
  const modalRef = useRef<HTMLIonModalElement>(null);

  // Daten filtern (wie vorher)
  const rawData = isAnnualView ? annualData : quarterlyData;
  const pointsToKeep = isAnnualView ? years : years * 4;
  // Stelle sicher, dass der Typ StockData aus dem Hook kompatibel ist
  // mit StockDataForFilter in utils.ts (oder verwende den gleichen Typ)
  const filteredDisplayData = filterDataToYears(rawData, pointsToKeep);

  // Dynamischen Key erzeugen
  // Nimmt die wichtigsten Parameter, die eine Änderung repräsentieren
  // Hinzufügen von Werten, um sicherzustellen, dass sich der Key ändert, wenn sich die *Daten* ändern
  const chartKey = `${title}-${isAnnualView}-${years}-${filteredDisplayData.labels?.length}-${filteredDisplayData.values?.[0]}-${filteredDisplayData.values?.[filteredDisplayData.values.length - 1]}`;

  return (
    <IonModal ref={modalRef} isOpen={isOpen} onDidDismiss={onClose} className="custom-modal">
      <IonContent className="ion-padding">
        <ModalHeader
          years={years} setYears={setYears}
          isAnnualView={isAnnualView} setIsAnnualView={setIsAnnualView}
          onClose={onClose}
        />
        <div className="modal-chart-container">
          {/* BarChart erhält jetzt den dynamischen key Prop */}
          <BarChart
            key={chartKey} // Hinzugefügt!
            data={filteredDisplayData}
            title={`${title} (${isAnnualView ? 'Annual' : 'Quarterly'})`}
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ChartModal;