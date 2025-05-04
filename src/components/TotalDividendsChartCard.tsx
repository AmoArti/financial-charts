// src/components/TotalDividendsChartCard.tsx
import React from 'react';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import BarChart from './BarChart'; // Importiere BarChart
import { MultiDatasetStockData } from '../hooks/useStockData'; // Importiere Typ

// Interface für die Props der Komponente
interface TotalDividendsChartCardProps {
  loading: boolean; // Um Fallback-Text korrekt anzuzeigen
  viewMode: 'annual' | 'quarterly';
  data: MultiDatasetStockData; // Die aufbereiteten und gesliceten Daten
}

const TotalDividendsChartCard: React.FC<TotalDividendsChartCardProps> = ({
  loading,
  viewMode,
  data
}) => {
  return (
    <IonCard style={{marginTop: '10px'}}> {/* Behalte den Abstand bei */}
      <IonCardHeader><IonCardTitle>Total Dividends Paid ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
      <IonCardContent>
        {/* Prüfe auf gültige Daten */}
        {data && data.labels && data.labels.length > 0 && data.datasets[0]?.values?.length > 0 ? (
           <div style={{ height: '300px', width: '100%' }}>
              <BarChart
                  data={data} // Nutze die übergebenen Daten
                  title={`Total Dividends Paid (${viewMode})`}
                  yAxisFormat="currency" // Skalierung in Mrd. wie Cashflow
                  yAxisLabel="Billions ($B)"
              />
           </div>
         ) : !loading && ( // Zeige nur Text, wenn nicht gerade geladen wird
           <p>Keine Daten zu Dividendenzahlungen verfügbar.</p>
         )}
         {/* Optional: Kleine Ladeanzeige innerhalb der Karte, wenn loading true ist? */}
         {/* {loading && <IonSpinner name="crescent" />} */}
      </IonCardContent>
    </IonCard>
  );
};

export default TotalDividendsChartCard;