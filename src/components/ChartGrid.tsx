// src/components/ChartGrid.tsx
import React from 'react';
import {
  IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import BarChart from './BarChart'; // Importiere BarChart hier
import { MultiDatasetStockData } from '../hooks/useStockData'; // Importiere Typ

// Interface für die Props der Komponente
// Benötigt alle aufbereiteten und gesliceten Chart-Daten sowie den viewMode & loading Status
interface ChartGridProps {
  loading: boolean; // Um Fallback-Text korrekt anzuzeigen
  viewMode: 'annual' | 'quarterly';
  incomeData: MultiDatasetStockData;
  cashflowData: MultiDatasetStockData;
  marginsData: MultiDatasetStockData;
  epsData: MultiDatasetStockData;
  sharesData: MultiDatasetStockData;
  debtToEquityData: MultiDatasetStockData;
}

const ChartGrid: React.FC<ChartGridProps> = ({
  loading,
  viewMode,
  incomeData,
  cashflowData,
  marginsData,
  epsData,
  sharesData,
  debtToEquityData
}) => {
  return (
    // Das komplette Grid aus Home.tsx hierher verschoben
    <IonGrid fixed={true}>
      {/* Row 1 */}
      <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard>
            <IonCardHeader><IonCardTitle>Income Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
            <IonCardContent>
              {incomeData && incomeData.labels && incomeData.labels.length > 0 && incomeData.datasets.length > 0 ? (
                <div style={{ height: '300px', width: '100%' }}>
                  <BarChart
                    data={incomeData}
                    title={`Income Statement (${viewMode})`}
                    yAxisFormat="currency"
                    yAxisLabel="Billions ($B)" />
                </div>)
              : !loading && (<p>Keine Income Statement Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
           <IonCard>
            <IonCardHeader><IonCardTitle>Cash Flow Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
            <IonCardContent>
              {cashflowData && cashflowData.labels && cashflowData.labels.length > 0 && cashflowData.datasets.length > 0 ? (
                  <div style={{ height: '300px', width: '100%' }}>
                      <BarChart
                          data={cashflowData}
                          title={`Cash Flow (${viewMode})`}
                          yAxisFormat="currency"
                          yAxisLabel="Billions ($B)"
                      />
                  </div>
              ) : !loading && ( <p>Keine Cashflow Daten verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      {/* Row 2 */}
      <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard>
            <IonCardHeader><IonCardTitle>Margins ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
            <IonCardContent>
              {marginsData && marginsData.labels && marginsData.labels.length > 0 && marginsData.datasets.length > 0 ? (
                <div style={{ height: '300px', width: '100%' }}>
                  <BarChart
                    data={marginsData}
                    title={`Margins (%) (${viewMode})`}
                    yAxisFormat="percent"
                    yAxisLabel="Margin (%)" />
                </div>)
              : !loading && (<p>Keine Margen-Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
          <IonCard>
            <IonCardHeader><IonCardTitle>EPS ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
            <IonCardContent>
              {epsData && epsData.labels && epsData.labels.length > 0 && epsData.datasets[0]?.values?.length > 0 ? (
                <div style={{ height: '300px', width: '100%' }}>
                  <BarChart
                    data={epsData}
                    title={`EPS (${viewMode})`}
                    yAxisFormat="number"
                    yAxisLabel="EPS ($)" />
                </div> )
              : !loading && (<p>Keine EPS Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      {/* Row 3 */}
       <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard>
            <IonCardHeader><IonCardTitle>Outstanding Shares ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
            <IonCardContent>
              {sharesData && sharesData.labels && sharesData.labels.length > 0 && sharesData.datasets[0]?.values?.length > 0 ? (
                 <div style={{ height: '300px', width: '100%' }}>
                    <BarChart
                        data={sharesData}
                        title={`Outstanding Shares (${viewMode})`}
                        yAxisFormat="ratio" // Formatierung auf 2 Nachkommastellen
                        yAxisLabel="Shares (Millions)"
                    />
                 </div>
               ) : !loading && ( <p>Keine Daten zu ausstehenden Aktien verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
          <IonCard>
            <IonCardHeader><IonCardTitle>Debt-to-Equity Ratio ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
            <IonCardContent>
              {debtToEquityData && debtToEquityData.labels && debtToEquityData.labels.length > 0 && debtToEquityData.datasets[0]?.values?.length > 0 ? (
                 <div style={{ height: '300px', width: '100%' }}>
                    <BarChart
                        data={debtToEquityData}
                        title={`Debt-to-Equity Ratio (${viewMode})`}
                        yAxisFormat="ratio" // Formatierung auf 2 Nachkommastellen
                        yAxisLabel="D/E Ratio"
                    />
                 </div>
               ) : !loading && ( <p>Keine Debt-to-Equity Daten verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default ChartGrid;