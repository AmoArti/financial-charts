import React from 'react';
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/react';
import { IonSegmentCustomEvent, SegmentChangeEventDetail } from '@ionic/core';
import './ChartControls.css';

interface YearOption {
  value: number;
  label: string;
}

interface ChartControlsProps {
  viewMode: 'annual' | 'quarterly';
  displayYears: number;
  yearOptions: YearOption[];
  onViewModeChange: (newViewMode: 'annual' | 'quarterly' | undefined) => void;
  onYearsChange: (newYearsString: string | undefined) => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  viewMode,
  displayYears,
  yearOptions,
  onViewModeChange,
  onYearsChange
}) => {

  return (
    <div className="chart-controls-container">
        <IonSegment
          aria-label="Anzeigeintervall"
          value={viewMode}
          onIonChange={(e: IonSegmentCustomEvent<SegmentChangeEventDetail>) => onViewModeChange(e.detail.value as 'annual' | 'quarterly' | undefined)}
        >
          <IonSegmentButton value="quarterly">
            <IonLabel>QUARTERLY</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="annual">
            <IonLabel>ANNUAL</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonSegment
          aria-label="Zeitraum"
          value={displayYears.toString()}
          onIonChange={(e: IonSegmentCustomEvent<SegmentChangeEventDetail>) => onYearsChange(e.detail.value?.toString())}
        >
          {yearOptions.map(option => (
            <IonSegmentButton key={option.value} value={option.value.toString()}>
              <IonLabel>{option.label}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
    </div>
  );
};

export default ChartControls;
