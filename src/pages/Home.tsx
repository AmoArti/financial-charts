// src/pages/Home.tsx (Final Refactored Version - KeyMetricsList, ChartControls, ChartGrid ausgelagert)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonToast,
  IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText // Behalten für Fallbacks/Info
} from '@ionic/react';
// Importiere Kernkomponenten
import SearchBar from '../components/SearchBar';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorCard from '../components/ErrorCard';
import CompanyInfoCard from '../components/CompanyInfoCard';
// Importiere ausgelagerte Komponenten
import KeyMetricsList from '../components/KeyMetricsList';
import ChartControls from '../components/ChartControls';
import ChartGrid from '../components/ChartGrid';
// Importiere Typen
import { useStockData, StockData, CompanyInfo, KeyMetrics, MultiDatasetStockData } from '../hooks/useStockData';
// Importiere die Slicing-Funktion
import { sliceMultiDataToLastNPoints } from '../utils/utils';
import './Home.css';

// Optionen und Defaults für Jahresauswahl
const quarterlyYearOptions = [
    { value: 1, label: '1Y' }, { value: 2, label: '2Y' }, { value: 4, label: '4Y' }, { value: 10, label: 'MAX' }
];
const annualYearOptions = [
    { value: 5, label: '5Y' }, { value: 10, label: '10Y' }, { value: 15, label: '15Y' }, { value: 20, label: 'MAX' }
];
const defaultYearsQuarterly = 4;
const defaultYearsAnnual = 10;

const Home: React.FC = () => {
  console.log("Rendering Home Component (Fully Refactored)...");

  // --- Hooks und State Deklarationen ---
   const {
    // Hole alle Daten vom Hook
    annualRevenue, quarterlyRevenue, annualEPS, quarterlyEPS,
    annualIncomeStatement, quarterlyIncomeStatement, annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement, annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    // Metadaten
    loading, error, progress, companyInfo, keyMetrics,
    // Funktion
    fetchData
  } = useStockData();


  // States für Controls und App-Zustand
  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('quarterly');
  const [displayYears, setDisplayYears] = useState<number>(defaultYearsQuarterly);
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const prevLoadingRef = useRef<boolean>(loading);

  // --- Daten für Anzeige vorbereiten und slicen ---
  // Diese Logik bleibt hier, da sie viewMode/displayYears (lokale States)
  // mit den Daten aus dem Hook kombiniert, um Props für ChartGrid zu erzeugen.
  const incomeDataFromHook = viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement;
  const epsDataBase = viewMode === 'annual' ? annualEPS : quarterlyEPS;
  const marginsDataFromHook = viewMode === 'annual' ? annualMargins : quarterlyMargins;
  const cashflowStatementFromHook = viewMode === 'annual' ? annualCashflowStatement : quarterlyCashflowStatement;
  const sharesDataBase = viewMode === 'annual' ? annualSharesOutstanding : quarterlySharesOutstanding;
  const debtToEquityDataBase = viewMode === 'annual' ? annualDebtToEquity : quarterlyDebtToEquity;

  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;

  // Slicing für alle Charts -> Ergebnisse werden als Props an ChartGrid weitergegeben
  const incomeDataForChart = sliceMultiDataToLastNPoints(incomeDataFromHook, pointsToKeep);
  const epsDataMulti: MultiDatasetStockData = { labels: epsDataBase?.labels || [], datasets: [{ label: 'EPS', values: epsDataBase?.values || [] }] };
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataMulti, pointsToKeep);
  const marginsDataForChart = sliceMultiDataToLastNPoints(marginsDataFromHook, pointsToKeep);
  const cashflowStatementDataForChart = sliceMultiDataToLastNPoints(cashflowStatementFromHook, pointsToKeep);
  const sharesDataMulti: MultiDatasetStockData = { labels: sharesDataBase?.labels || [], datasets: [{ label: 'Shares Out (M)', values: sharesDataBase?.values || [] }]};
  const sharesDataForChart = sliceMultiDataToLastNPoints(sharesDataMulti, pointsToKeep);
  const debtToEquityDataMulti: MultiDatasetStockData = { labels: debtToEquityDataBase?.labels || [], datasets: [{ label: 'D/E Ratio', values: debtToEquityDataBase?.values || [] }]};
  const debtToEquityDataForChart = sliceMultiDataToLastNPoints(debtToEquityDataMulti, pointsToKeep);


  // --- Event Handlers ---
  // Bleiben hier, da sie lokalen State (currentTicker, viewMode, displayYears) ändern
  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  const handleRetry = () => { if (currentTicker) fetchData(currentTicker); };
  const handleGlobalYearsChange = (newYearsString: string | undefined) => {
    if (newYearsString === undefined) return;
    const newYears = parseInt(newYearsString, 10);
    if (isNaN(newYears) || newYears === displayYears) return;
    setDisplayYears(newYears);
  };
  const handleGlobalViewChange = (newViewMode: 'annual' | 'quarterly' | undefined) => {
    if (newViewMode === undefined || (newViewMode !== 'annual' && newViewMode !== 'quarterly') || newViewMode === viewMode) return;
    setViewMode(newViewMode);
    const newDefaultYears = newViewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly;
    setDisplayYears(newDefaultYears);
  };

  // --- useEffect Hooks ---
  // Bleiben hier, da sie auf lokalen State oder Hook-Daten reagieren
  useEffect(() => {
     document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);
  useEffect(() => {
    if (prevLoadingRef.current && !loading && !error && currentTicker) {
      const hasIncomeData = incomeDataForChart?.labels?.length > 0;
      if (hasIncomeData) {
        setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
      }
    }
  }, [loading, error, currentTicker, incomeDataForChart]);
  useEffect(() => {
    prevLoadingRef.current = loading;
  });
  useEffect(() => {
    if (currentTicker) {
      console.log(`Workspaceing initial data for ${currentTicker}`);
      fetchData(currentTicker);
      setSuccessMessage('');
      setDisplayYears(viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly);
    }
  }, [currentTicker, viewMode, fetchData]);

  // --- Helper Functions ---
  // Bleiben hier, da sie an Kindkomponenten als Props gehen
  const formatMarketCap = (marketCap: string | null | undefined): string => {
    if (!marketCap || marketCap === 'None') return 'N/A';
    const num = parseFloat(marketCap);
    if(isNaN(num)) return 'N/A';
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + ' Mrd. $';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + ' Mio. $';
    } else {
        return num.toFixed(0) + ' $';
    }
  };
  const getErrorDetails = (errorMessage: string | null): { explanation: string; recommendation: string } => {
    let explanation = 'Ein Fehler ist aufgetreten.';
    let recommendation = 'Bitte versuchen Sie es erneut oder laden Sie die Seite neu.';
    const safeErrorMessage = errorMessage || "";

    if (safeErrorMessage.includes('API-Fehler bei') || safeErrorMessage.includes('Ungültiger Ticker') || safeErrorMessage.includes('nicht gefunden (Status 404)')) {
      explanation = `Der eingegebene Ticker "${currentTicker || ''}" wurde nicht gefunden oder ist ungültig.`; recommendation = 'Bitte überprüfen Sie die Schreibweise (z.B. AAPL für Apple).';
    } else if (safeErrorMessage.includes('API-Limit erreicht')) {
      explanation = 'Das Abfragelimit für die API wurde erreicht (Alpha Vantage Free Tier).'; recommendation = 'Bitte warten Sie eine Minute und versuchen Sie es erneut.';
    } else if (safeErrorMessage.includes('Keine Finanzdaten') || safeErrorMessage.includes('Keine Unternehmensinformationen') || safeErrorMessage.includes('Kein aktueller Aktienkurs')) {
      explanation = `Für den Ticker "${currentTicker || ''}" konnten notwendige Daten nicht gefunden werden.`; recommendation = 'Möglicherweise werden für diesen Ticker nicht alle Daten von Alpha Vantage bereitgestellt.';
    } else if (safeErrorMessage.includes('API-Schlüssel nicht gefunden')) {
      explanation = 'Der API-Schlüssel für Alpha Vantage fehlt.'; recommendation = 'Bitte überprüfen Sie die Konfiguration (z.B. .env Datei).';
    } else if (safeErrorMessage) {
      explanation = `Ein unerwarteter Fehler ist aufgetreten: ${safeErrorMessage}`;
      recommendation = 'Bitte versuchen Sie es erneut. Bei anhaltenden Problemen prüfen Sie die Browserkonsole.';
    }
    return { explanation, recommendation };
  };

  // Aktuelle Jahresoptionen bestimmen (bleibt hier)
  const currentYearOptions = viewMode === 'annual' ? annualYearOptions : quarterlyYearOptions;

  // --- JSX Return ---
  // Deutlich kürzer durch ausgelagerte Komponenten
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>
        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {/* === Lade-, Fehler-, Erfolgsanzeigen === */}
          {loading && !companyInfo && <LoadingIndicator progress={progress} />}
          {typeof error === 'string' && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {/* === Hauptinhalt (nur wenn Ticker gesetzt und kein Fehler) === */}
          {currentTicker && !error && (
            <>
              {/* --- Info & Kennzahlen --- */}
              <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} />
              <KeyMetricsList keyMetrics={keyMetrics} />

              {/* --- Steuerung & Charts (nur wenn Company Info geladen) --- */}
              {companyInfo && (
                 <>
                    {/* Ausgelagerte ChartControls Komponente */}
                    <ChartControls
                      viewMode={viewMode}
                      displayYears={displayYears}
                      yearOptions={currentYearOptions}
                      onViewModeChange={handleGlobalViewChange}
                      onYearsChange={handleGlobalYearsChange}
                    />

                    {/* Ausgelagerte ChartGrid Komponente */}
                    <ChartGrid
                       loading={loading}
                       viewMode={viewMode}
                       incomeData={incomeDataForChart}
                       cashflowData={cashflowStatementDataForChart}
                       marginsData={marginsDataForChart}
                       epsData={epsDataForChart}
                       sharesData={sharesDataForChart}
                       debtToEquityData={debtToEquityDataForChart}
                    />
                 </>
              )} {/* Ende if(companyInfo) */}
            </>
          )} {/* Ende if(currentTicker && !error) */}

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
// --- Ende Home.tsx ---