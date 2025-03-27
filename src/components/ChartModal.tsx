// src/components/ChartModal.tsx
import React, { useRef } from 'react';
import { IonModal, IonContent } from '@ionic/react';
import ModalHeader from './ModalHeader';
import BarChart from './BarChart';
import { StockData } from '../hooks/useStockData';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  annualData: StockData;
  quarterlyData: StockData;
  isAnnualView: boolean;
  setIsAnnualView: (isAnnual: boolean) => void;
  years: number;
  setYears: (years: number) => void;
}

const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  title,
  annualData,
  quarterlyData,
  isAnnualView,
  setIsAnnualView,
  years,
  setYears,
}) => {
  const modalRef = useRef<HTMLIonModalElement>(null);

  return (
    <IonModal ref={modalRef} isOpen={isOpen} onDidDismiss={onClose} className="custom-modal">
      <IonContent className="ion-padding">
        <ModalHeader
          years={years}
          setYears={setYears}
          isAnnualView={isAnnualView}
          setIsAnnualView={setIsAnnualView}
          onClose={onClose}
        />
        <div className="modal-chart-container">
          <BarChart
            data={isAnnualView ? annualData : quarterlyData}
            title={`${title} (${isAnnualView ? 'Annual' : 'Quarterly'})`}
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ChartModal;