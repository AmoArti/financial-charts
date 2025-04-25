// src/pages/Home.tsx (Daten-Slicing vor Chart-Übergabe)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol,
  IonToast, IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import CompanyInfoCard from '../components/CompanyInfoCard';
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { useStockData, StockData, CompanyInfo, KeyMetrics, MultiDatasetStockData } from '../hooks/useStockData';
// NEU: Importiere sliceMultiDataToLastNPoints
import { sliceMultiDataToLastNPoints } from '../utils/utils';
import './Home.css';

// Definiere die Optionen für die Jahresauswahl (unverändert)
const quarterlyYearOptions = [
    { value: 1, label: '1Y' },
    { value: 2, label: '2Y' },
    { value: 4, label: '4Y' },
    { value: 10, label: 'MAX' }
];
const annualYearOptions = [
    { value: 5, label: '5Y' },
    { value: 10, label: '10Y' },
    { value: 15, label: '15Y' },
    { value: 20, label: 'MAX' }
];
const defaultYearsQuarterly = 4;
const defaultYearsAnnual = 10;

const Home: React.FC = () => {
  // --- Hooks und State Deklarationen ---
  const {
    annualEPS, quarterlyEPS,
    annualFCF, quarterlyFCF,
    annualIncomeStatement, quarterlyIncomeStatement,
    loading, error, progress, companyInfo, keyMetrics, fetchData
  } = useStockData();

  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('quarterly');
  const [displayYears, setDisplayYears] = useState<number>(defaultYearsQuarterly);
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [maxYearsFetched, setMaxYearsFetched] = useState<number>(0);
  const [isFetchingMoreYears, setIsFetchingMoreYears] = useState<boolean>(false);
  const prevLoadingRef = useRef<boolean>(loading);

  // --- Daten aus Hook holen ---
  // Diese repräsentieren die *maximal* verfügbaren Daten (bis maxYearsFetched)
  const incomeDataFromHook = viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement;
  const epsDataBase = viewMode === 'annual' ? annualEPS : quarterlyEPS;
  const fcfDataBase = viewMode === 'annual' ? annualFCF : quarterlyFCF;

  // *** Daten basierend auf displayYears kürzen/slicen für die Anzeige ***
  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;

  const incomeDataForChart = sliceMultiDataToLastNPoints(incomeDataFromHook, pointsToKeep);

  // Konvertiere EPS/FCF Daten temporär zu MultiDataset und slice dann
  const epsDataMulti: MultiDatasetStockData = {
      labels: epsDataBase.labels || [],
      datasets: [{ label: 'EPS', values: epsDataBase.values || [] }]
  };
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataMulti, pointsToKeep);

  const fcfDataMulti: MultiDatasetStockData = {
      labels: fcfDataBase.labels || [],
      datasets: [{ label: 'FCF', values: fcfDataBase.values || [] }]
  };
  const fcfDataForChart = sliceMultiDataToLastNPoints(fcfDataMulti, pointsToKeep);


  // --- useEffect Hooks ---
  useEffect(() => { document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard"; }, [currentTicker]);

  // useEffect für Erfolgsmeldung (prüft jetzt geslicete Daten)
  useEffect(() => {
      if (prevLoadingRef.current && !loading && !error && currentTicker) {
           const hasIncomeData = incomeDataForChart?.labels?.length > 0; // Prüfe geslicete Daten
           if(hasIncomeData) {
               setSuccessMessage(`Daten für ${currentTicker} (${displayYears} Jahre) erfolgreich geladen`);
           }
      }
  }, [loading, error, currentTicker, displayYears, incomeDataForChart]); // Abhängigkeit angepasst

  // Effekt zum Aktualisieren des Refs
  useEffect(() => {
    prevLoadingRef.current = loading;
  });

  // Effekt zum Abrufen der initialen Daten bei Ticker-Änderung
  useEffect(() => {
    if (currentTicker) {
      console.log(`[Home useEffect - Ticker Change] Fetching initial data for ${currentTicker} (${displayYears} years)`);
      fetchData(currentTicker, displayYears);
      setMaxYearsFetched(displayYears);
      setSuccessMessage('');
      setIsFetchingMoreYears(false);
    } else {
      setMaxYearsFetched(0);
      setIsFetchingMoreYears(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicker]);

  // Effekt zum Zurücksetzen von displayYears bei viewMode-Wechsel
  useEffect(() => {
    if (!loading && currentTicker) { // Nur ausführen, wenn nicht gerade geladen wird und Ticker existiert
        console.log(`[Home useEffect - ViewMode Change] ViewMode changed to ${viewMode}. Resetting years.`);
        const newDefaultYears = viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly;
        if (displayYears !== newDefaultYears) {
            setDisplayYears(newDefaultYears);
            if (newDefaultYears > maxYearsFetched) {
                console.log(`Fetching data for new default years ${newDefaultYears} (max was ${maxYearsFetched})`);
                setMaxYearsFetched(newDefaultYears);
                fetchData(currentTicker, newDefaultYears);
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]); // Nur von viewMode abhängig

  // useEffect zum Zurücksetzen von isFetchingMoreYears
  useEffect(() => {
     if (!loading && isFetchingMoreYears) {
         setIsFetchingMoreYears(false);
         console.log("[Home useEffect - Loading End] Resetting isFetchingMoreYears flag.");
     }
  }, [loading, isFetchingMoreYears]);


  // --- Event Handlers ---
  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  const handleRetry = () => {
    if (currentTicker) {
        console.log(`[Home handleRetry] Retrying fetch for ${currentTicker} (${displayYears} years)`);
        fetchData(currentTicker, displayYears);
    }
   };

  // Handler für globale Jahresauswahl
  const handleGlobalYearsChange = (newYearsString: string | undefined) => {
    if (newYearsString === undefined) return;
    const newYears = parseInt(newYearsString, 10);
    if (isNaN(newYears) || newYears === displayYears) return;

    console.log(`[Home handleGlobalYearsChange] Years changed to ${newYears}`);
    setDisplayYears(newYears);
    if (currentTicker && newYears > maxYearsFetched) {
      console.log(`Fetching additional data for ${newYears} years (max was ${maxYearsFetched}).`);
      setIsFetchingMoreYears(true);
      setMaxYearsFetched(newYears);
      fetchData(currentTicker, newYears);
    } else {
      if (isFetchingMoreYears) setIsFetchingMoreYears(false);
    }
  };

  // Handler für globale Ansicht
  const handleGlobalViewChange = (newViewMode: 'annual' | 'quarterly' | undefined) => {
      if (newViewMode === undefined || (newViewMode !== 'annual' && newViewMode !== 'quarterly') || newViewMode === viewMode) return;
      console.log(`[Home handleGlobalViewChange] View changed to ${newViewMode}`);
      setViewMode(newViewMode);
  };

  // --- Helper Functions (unverändert) ---
  const formatMarketCap = (marketCap: string | null | undefined): string => { /* ... */ };
  const getErrorDetails = (errorMessage: string): { explanation: string; recommendation: string } => { /* ... */ };

  // Bestimme die aktuell anzuzeigenden Jahresoptionen
  const currentYearOptions = viewMode === 'annual' ? annualYearOptions : quarterlyYearOptions;

  // --- JSX Return ---
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>
        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {/* Ladeanzeige / Fehler / Erfolgsmeldung */}
          {loading && !isFetchingMoreYears && !companyInfo && <LoadingIndicator progress={progress} />}
          {typeof error === 'string' && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {/* Company Info & Key Metrics */}
          {companyInfo && ( <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} /> )}
          {keyMetrics && (
             <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
                {/* ... Kennzahlen Items mit ?? 'N/A' ... */}
             </IonList>
           )}

           {/* --- Globale Bedienelemente mit DYNAMISCHER Jahresauswahl --- */}
           {!error && currentTicker && companyInfo && (
             <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                 <IonSegment value={viewMode} onIonChange={(e) => handleGlobalViewChange(e.detail.value as 'annual' | 'quarterly' | undefined)} style={{ marginBottom: '10px' }}>
                   <IonSegmentButton value="quarterly"><IonLabel>QUARTER</IonLabel></IonSegmentButton>
                   <IonSegmentButton value="annual"><IonLabel>ANNUAL</IonLabel></IonSegmentButton>
                 </IonSegment>
                 <IonSegment value={displayYears.toString()} onIonChange={(e) => handleGlobalYearsChange(e.detail.value)}>
                   {currentYearOptions.map(option => (
                      <IonSegmentButton key={option.value} value={option.value.toString()}>
                          <IonLabel>{option.label}</IonLabel>
                      </IonSegmentButton>
                   ))}
                 </IonSegment>
             </div>
           )}

          {/* --- Bereich für die direkt angezeigten Charts --- */}
          {!error && currentTicker && companyInfo && (
            <div style={{ marginTop: '10px' }}>
              {isFetchingMoreYears && <div style={{textAlign: 'center', padding: '20px'}}><IonSpinner name="crescent" /><p>Lade mehr Daten...</p></div>}

              {/* Income Statement Chart - Nutzt jetzt geslicete Daten */}
              <IonCard>
                <IonCardHeader><IonCardTitle>Income Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                  {incomeDataForChart.labels.length > 0 && incomeDataForChart.datasets.length > 0 ? (
                    <div style={{ height: '300px', width: '100%' }}>
                      <BarChart data={incomeDataForChart} title={`Income Statement (${viewMode === 'annual' ? 'Annual' : 'Quarterly'})`} />
                    </div>
                  ) : !loading && (<p>Keine Income Statement Daten verfügbar für die Auswahl.</p>)}
                </IonCardContent>
              </IonCard>

              {/* EPS Chart - Nutzt jetzt geslicete Daten */}
              <IonCard>
                <IonCardHeader><IonCardTitle>EPS ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                   {epsDataForChart.labels.length > 0 && epsDataForChart.datasets[0]?.values?.length > 0 ? (
                     <div style={{ height: '300px', width: '100%' }}>
                       <BarChart data={epsDataForChart} title={`EPS (${viewMode === 'annual' ? 'Annual' : 'Quarterly'})`} />
                     </div>
                  ) : !loading && (<p>Keine EPS Daten verfügbar für die Auswahl.</p>)}
                </IonCardContent>
              </IonCard>

              {/* FCF Chart - Nutzt jetzt geslicete Daten */}
              <IonCard>
                <IonCardHeader><IonCardTitle>Free Cash Flow ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                   {fcfDataForChart.labels.length > 0 && fcfDataForChart.datasets[0]?.values?.length > 0 ? (
                    <div style={{ height: '300px', width: '100%' }}>
                      <BarChart data={fcfDataForChart} title={`FCF (${viewMode === 'annual' ? 'Annual' : 'Quarterly'})`} />
                    </div>
                  ) : !loading && (<p>Keine FCF Daten verfügbar für die Auswahl.</p>)}
                </IonCardContent>
              </IonCard>

            </div>
          )}

          {/* Platzhalter */}
          {!currentTicker && !loading && !error && (
            <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
              <p>Bitte geben Sie oben ein Aktiensymbol ein (z.B. AAPL, IBM).</p>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};
export default Home;