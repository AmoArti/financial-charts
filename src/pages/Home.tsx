// src/pages/Home.tsx (Mit zusätzlichem console.log vor CompanyInfoCard)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol,
  IonToast, IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import CompanyInfoCard from '../components/CompanyInfoCard'; // Importiert die robustere Version
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { useStockData, StockData, CompanyInfo, KeyMetrics, MultiDatasetStockData } from '../hooks/useStockData';
import { sliceMultiDataToLastNPoints } from '../utils/utils';
import './Home.css';

// Optionen und Defaults (unverändert)
const quarterlyYearOptions = [
    { value: 1, label: '1Y' }, { value: 2, label: '2Y' }, { value: 4, label: '4Y' }, { value: 10, label: 'MAX' }
];
const annualYearOptions = [
    { value: 5, label: '5Y' }, { value: 10, label: '10Y' }, { value: 15, label: '15Y' }, { value: 20, label: 'MAX' }
];
const defaultYearsQuarterly = 4;
const defaultYearsAnnual = 10;

const Home: React.FC = () => {
  // --- Hooks und State Deklarationen ---
  const {
    annualEPS, quarterlyEPS, annualFCF, quarterlyFCF,
    annualIncomeStatement, quarterlyIncomeStatement,
    loading, error, progress, companyInfo, keyMetrics, fetchData
  } = useStockData();

  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('quarterly');
  const [displayYears, setDisplayYears] = useState<number>(defaultYearsQuarterly);
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const prevLoadingRef = useRef<boolean>(loading);

  // --- Daten für Anzeige slicen ---
  const incomeDataFromHook = viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement;
  const epsDataBase = viewMode === 'annual' ? annualEPS : quarterlyEPS;
  const fcfDataBase = viewMode === 'annual' ? annualFCF : quarterlyFCF;
  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;
  const incomeDataForChart = sliceMultiDataToLastNPoints(incomeDataFromHook, pointsToKeep);
  const epsDataMulti: MultiDatasetStockData = { labels: epsDataBase.labels || [], datasets: [{ label: 'EPS', values: epsDataBase.values || [] }] };
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataMulti, pointsToKeep);
  const fcfDataMulti: MultiDatasetStockData = { labels: fcfDataBase.labels || [], datasets: [{ label: 'FCF', values: fcfDataBase.values || [] }] };
  const fcfDataForChart = sliceMultiDataToLastNPoints(fcfDataMulti, pointsToKeep);

  // --- useEffect Hooks ---
  useEffect(() => { document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard"; }, [currentTicker]);
  useEffect(() => { /* Success Message */ }, [loading, error, currentTicker, displayYears, incomeDataForChart]);
  useEffect(() => { prevLoadingRef.current = loading; });
  useEffect(() => { /* Fetch on Ticker Change */ }, [currentTicker]);
  useEffect(() => { /* Reset displayYears on viewMode change */ }, [viewMode, loading, currentTicker]); // Deps angepasst
  // useEffect für isFetchingMoreYears entfernt, da State entfernt wurde

  // --- Event Handlers ---
  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  const handleRetry = () => { if (currentTicker) { fetchData(currentTicker); } };
  const handleGlobalYearsChange = (newYearsString: string | undefined) => {
     if (newYearsString === undefined) return;
     const newYears = parseInt(newYearsString, 10);
     if (isNaN(newYears) || newYears === displayYears) return;
     setDisplayYears(newYears);
     // Kein Fetch mehr hier
  };
  const handleGlobalViewChange = (newViewMode: 'annual' | 'quarterly' | undefined) => {
     if (newViewMode === undefined || (newViewMode !== 'annual' && newViewMode !== 'quarterly') || newViewMode === viewMode) return;
     setViewMode(newViewMode);
  };

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string | null | undefined): string => {
     if (!marketCap) return 'N/A';
     const num = parseFloat(marketCap);
     if(isNaN(num)) return 'N/A';
     return (num / 1e9).toFixed(2) + ' Mrd. $';
  };
  const getErrorDetails = (errorMessage: string | null): { explanation: string; recommendation: string } => { // Erlaube null für errorMessage
      let explanation = 'Ein Fehler ist aufgetreten.'; // Default
      let recommendation = 'Bitte versuchen Sie es erneut oder laden Sie die Seite neu.'; // Default
      const safeErrorMessage = errorMessage || ""; // Stelle sicher, dass wir einen String haben

      if (safeErrorMessage.includes('API-Fehler bei') || safeErrorMessage.includes('Ungültiger Ticker')) { explanation = 'Der eingegebene Ticker wurde nicht gefunden oder ist ungültig.'; recommendation = 'Bitte überprüfen Sie die Schreibweise (z.B. AAPL für Apple).'; }
      else if (safeErrorMessage.includes('API-Limit erreicht')) { explanation = 'Das Abfragelimit für die API wurde erreicht (Alpha Vantage Free Tier).'; recommendation = 'Bitte warten Sie eine Minute und versuchen Sie es erneut.'; }
      else if (safeErrorMessage.includes('Keine Finanzdaten') || safeErrorMessage.includes('Keine Unternehmensinformationen') || safeErrorMessage.includes('Kein aktueller Aktienkurs')) { explanation = `Für den Ticker "${currentTicker || ''}" konnten notwendige Daten nicht gefunden werden.`; recommendation = 'Möglicherweise werden für diesen Ticker nicht alle Daten von Alpha Vantage bereitgestellt.'; }
      else if (safeErrorMessage.includes('API-Schlüssel nicht gefunden')) { explanation = 'Der API-Schlüssel für Alpha Vantage fehlt.'; recommendation = 'Bitte überprüfen Sie die Konfiguration (z.B. .env Datei).'}
      else if (safeErrorMessage) { // Zeige spezifischeren Fehler, wenn vorhanden
          explanation = `Ein unerwarteter Fehler ist aufgetreten: ${safeErrorMessage}`;
          recommendation = 'Bitte versuchen Sie es erneut. Bei anhaltenden Problemen prüfen Sie die Browserkonsole.';
      }
      return { explanation, recommendation };
  };

  // Aktuelle Jahresoptionen bestimmen
  const currentYearOptions = viewMode === 'annual' ? annualYearOptions : quarterlyYearOptions;

  // --- JSX Return ---
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>
        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {/* Initialer Ladebalken */}
          {loading && !companyInfo && <LoadingIndicator progress={progress} />}
          {/* Fehler */}
          {typeof error === 'string' && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}
          {/* Erfolg */}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {/* Company Info Card mit Debug Log davor */}
          { console.log('DEBUG: Rendering CompanyInfoCard check, companyInfo is:', companyInfo); }
          {companyInfo && ( <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} /> )}

          {/* Key Metrics Liste mit N/A Fallback */}
          {keyMetrics && (
             <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
                 {/* ... Kennzahlen Items mit ?? 'N/A' ... */}
             </IonList>
           )}

           {/* Globale Bedienelemente */}
           {!error && currentTicker && companyInfo && (
             <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                 {/* Segment für Annual/Quarterly */}
                 <IonSegment value={viewMode} onIonChange={(e) => handleGlobalViewChange(e.detail.value as 'annual' | 'quarterly' | undefined)} style={{ marginBottom: '10px' }}>
                   <IonSegmentButton value="quarterly"><IonLabel>QUARTER</IonLabel></IonSegmentButton>
                   <IonSegmentButton value="annual"><IonLabel>ANNUAL</IonLabel></IonSegmentButton>
                 </IonSegment>
                 {/* Segment für Jahre */}
                 <IonSegment value={displayYears.toString()} onIonChange={(e) => handleGlobalYearsChange(e.detail.value)}>
                   {currentYearOptions.map(option => (
                      <IonSegmentButton key={option.value} value={option.value.toString()}>
                          <IonLabel>{option.label}</IonLabel>
                      </IonSegmentButton>
                   ))}
                 </IonSegment>
             </div>
           )}

          {/* Bereich für die direkt angezeigten Charts */}
          {!error && currentTicker && companyInfo && (
            <div style={{ marginTop: '10px' }}>
              {/* Income Statement Chart */}
              <IonCard>
                <IonCardHeader><IonCardTitle>Income Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                     {incomeDataForChart.labels.length > 0 && incomeDataForChart.datasets.length > 0 ? ( <div style={{ height: '300px', width: '100%' }}><BarChart data={incomeDataForChart} title={`Income Statement (${viewMode === 'annual' ? 'Annual' : 'Quarterly'})`} /></div>)
                     : !loading && (<p>Keine Income Statement Daten verfügbar für die Auswahl.</p>)}
                 </IonCardContent>
              </IonCard>
              {/* EPS Chart */}
              <IonCard>
                 <IonCardHeader><IonCardTitle>EPS ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                 <IonCardContent>
                     {epsDataForChart.labels.length > 0 && epsDataForChart.datasets[0]?.values?.length > 0 ? ( <div style={{ height: '300px', width: '100%' }}><BarChart data={epsDataForChart} title={`EPS (${viewMode === 'annual' ? 'Annual' : 'Quarterly'})`} /></div> )
                     : !loading && (<p>Keine EPS Daten verfügbar für die Auswahl.</p>)}
                 </IonCardContent>
              </IonCard>
              {/* FCF Chart */}
              <IonCard>
                 <IonCardHeader><IonCardTitle>Free Cash Flow ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                 <IonCardContent>
                     {fcfDataForChart.labels.length > 0 && fcfDataForChart.datasets[0]?.values?.length > 0 ? ( <div style={{ height: '300px', width: '100%' }}><BarChart data={fcfDataForChart} title={`FCF (${viewMode === 'annual' ? 'Annual' : 'Quarterly'})`} /></div>)
                     : !loading && (<p>Keine FCF Daten verfügbar für die Auswahl.</p>)}
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