// src/components/ChartControls.tsx
import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';

// Typ für die Jahresoptionen (kann auch aus einem Typen-File importiert werden)
interface YearOption {
  value: number;
  label: string;
}

// Interface für die Props der Komponente
interface ChartControlsProps {
  viewMode: 'annual' | 'quarterly';
  displayYears: number;
  yearOptions: YearOption[]; // Array der aktuell gültigen Jahresoptionen
  // Callback-Funktionen für Änderungen
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
    // Der Container-Div, der vorher in Home.tsx war
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      {/* Segment für Annual/Quarterly */}
      <IonSegment
        value={viewMode}
        // Direkter Aufruf der übergebenen Handler-Funktion
        onIonChange={(e) => onViewModeChange(e.detail.value as 'annual' | 'quarterly' | undefined)}
        style={{ marginBottom: '10px' }}
      >
        <IonSegmentButton value="quarterly">
          <IonLabel>QUARTER</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="annual">
          <IonLabel>ANNUAL</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      {/* Segment für die Jahresauswahl */}
      <IonSegment
        value={displayYears.toString()}
        // Direkter Aufruf der übergebenen Handler-Funktion
        onIonChange={(e) => onYearsChange(e.detail.value)}
      >
        {/* Mappe über die übergebenen Optionen */}
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