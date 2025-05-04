// src/components/DividendPerShareChartCard.tsx
import React from 'react';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import BarChart from './BarChart'; // Importiere BarChart
import { MultiDatasetStockData } from '../hooks/useStockData'; // Importiere Typ

// Interface für die Props der Komponente
interface DividendPerShareChartCardProps {
  loading: boolean; // Um Fallback-Text korrekt anzuzeigen
  viewMode: 'annual' | 'quarterly';
  data: MultiDatasetStockData; // Die aufbereiteten und gesliceten DPS-Daten
}

const DividendPerShareChartCard: React.FC<DividendPerShareChartCardProps> = ({
  loading,
  viewMode,
  data
}) => {
  // Entscheide, ob genügend Daten zum Anzeigen vorhanden sind
  const hasData = data && data.labels && data.labels.length > 0 && data.datasets[0]?.values?.length > 0;

  // Rendere nichts, wenn keine Daten vorhanden sind und nicht geladen wird (optional, oder Fallback zeigen)
  // if (!hasData && !loading) {
  //   return null; // Oder eine kleine Meldung statt der ganzen Karte
  // }

  return (
    // Gib die Karte immer aus, zeige innen Fallback oder Chart an
    <IonCard style={{marginTop: '10px'}}>
      <IonCardHeader><IonCardTitle>Dividend Per Share ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
      <IonCardContent>
        {/* Prüfe auf gültige Daten */}
        {hasData ? (
           <div style={{ height: '300px', width: '100%' }}>
              <BarChart
                  data={data} // Nutze die übergebenen DPS-Daten
                  title={`Dividend Per Share (${viewMode})`}
                  yAxisFormat="number" // Normale Zahl
                  yAxisLabel="DPS ($)"  // Einheiten hinzufügen
              />
           </div>
         ) : !loading && ( // Zeige nur Text, wenn nicht gerade geladen wird
           <p>Keine Dividenden-pro-Aktie Daten verfügbar.</p>
         )}
         {/* Optional: Ladeanzeige innerhalb der Karte */}
         {/* {loading && <IonSpinner name="crescent" />} */}
      </IonCardContent>
    </IonCard>
  );
};

export default DividendPerShareChartCard;