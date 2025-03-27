// src/components/ModalHeader.tsx
import React from 'react';
import { IonButton, IonIcon, IonToggle, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

interface ModalHeaderProps {
  years: number;
  setYears: (years: number) => void;
  isAnnualView: boolean;
  setIsAnnualView: (isAnnual: boolean) => void;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  years,
  setYears,
  isAnnualView,
  setIsAnnualView,
  onClose,
}) => {
  return (
    <div className="modal-header">
      <div className="chart-header">
        <IonSelect
          value={years}
          placeholder="Zeitspanne auswählen"
          onIonChange={(e) => setYears(e.detail.value)}
          interface="popover"
        >
          <IonSelectOption value={5}>5 Jahre</IonSelectOption>
          <IonSelectOption value={10}>10 Jahre</IonSelectOption>
          <IonSelectOption value={20}>20 Jahre</IonSelectOption>
        </IonSelect>
      </div>
      <div className="toggle-wrapper">
        <div className="toggle-container">
          <IonLabel>Quarterly</IonLabel>
          <IonToggle
            checked={isAnnualView}
            onIonChange={(e) => setIsAnnualView(e.detail.checked)}
          />
          <IonLabel>Annual</IonLabel>
        </div>
      </div>
      <IonButton fill="clear" className="close-button" onClick={onClose}>
        <IonIcon icon={closeOutline} />
      </IonButton>
    </div>
  );
};

export default ModalHeader;