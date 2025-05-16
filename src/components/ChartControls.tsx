// src/components/ChartControls.tsx (Version mit zwei IonSegments, ohne äußere Margins)
import React from 'react';
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect, // Import bleibt, falls du doch mal zu Select wechseln willst, aber aktuell nicht genutzt
  IonSelectOption // Import bleibt, falls du doch mal zu Select wechseln willst
} from '@ionic/react';

// Typ für die Jahresoptionen
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

  // handleSelectChange wird nicht mehr benötigt, wenn wir IonSegment verwenden
  // const handleSelectChange = (event: CustomEvent) => {
  //   const value = event.detail.value;
  //   if (value !== null && value !== undefined) {
  //       onYearsChange(String(value));
  //   } else {
  //       onYearsChange(undefined);
  //   }
  // };

  return (
    // Der Container-Div.
    // Die Styles für marginTop/marginBottom wurden entfernt,
    // da der .chart-controls-sticky-wrapper in Home.css jetzt padding hat.
    // Die Flexbox-Styles hier zentrieren die beiden Segment-Gruppen, falls der Wrapper breiter ist.
    <div style={{
        display: 'flex',
        justifyContent: 'center', // Zentriert die Segmente horizontal
        alignItems: 'center',
        gap: '16px', // Abstand zwischen den Segmenten, falls sie nebeneinander passen
        flexWrap: 'wrap', // Erlaubt Umbruch auf kleinen Schirmen
        width: '100%' // Nimmt die Breite des Sticky-Wrappers ein
        }}>

      {/* Segment für Annual/Quarterly */}
      {/* Optional: ein div als Gruppe, falls Labels davor sollen */}
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> */}
        {/* <IonLabel>Ansicht:</IonLabel> */}
        <IonSegment
          value={viewMode}
          onIonChange={(e) => onViewModeChange(e.detail.value as 'annual' | 'quarterly' | undefined)}
          // style={{ marginBottom: '10px' }} // Nicht mehr nötig, wenn nebeneinander oder mit gap
        >
          <IonSegmentButton value="quarterly">
            <IonLabel>QUARTERLY</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="annual">
            <IonLabel>ANNUAL</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      {/* </div> */}


      {/* Segment für die Jahresauswahl */}
      {/* Optional: ein div als Gruppe, falls Labels davor sollen */}
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> */}
        {/* <IonLabel>Zeitraum:</IonLabel> */}
        <IonSegment
          value={displayYears.toString()}
          onIonChange={(e) => onYearsChange(e.detail.value)}
        >
          {yearOptions.map(option => (
            <IonSegmentButton key={option.value} value={option.value.toString()}>
              <IonLabel>{option.label}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
      {/* </div> */}
    </div>
  );
};

export default ChartControls;
// --- Ende ChartControls.tsx ---