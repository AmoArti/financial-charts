// src/pages/Home.tsx (Conditionally Sticky Chart Controls - Vollständig)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonToast,
  IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol
} from '@ionic/react';
import SearchBar from '../components/SearchBar';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorCard from '../components/ErrorCard';
import CompanyInfoCard from '../components/CompanyInfoCard';
import KeyMetricsList from '../components/KeyMetricsList';
import ChartControls from '../components/ChartControls';
import ChartGrid from '../components/ChartGrid';
import TotalDividendsChartCard from '../components/TotalDividendsChartCard';
import DividendPerShareChartCard from '../components/DividendPerShareChartCard';
// Importiere Typen
import { useStockData, StockData, CompanyInfo, KeyMetrics, MultiDatasetStockData } from '../hooks/useStockData';
// Importiere die Slicing-Funktion
import { sliceMultiDataToLastNPoints } from '../utils/utils';
import './Home.css'; // Stellt sicher, dass die Klasse .chart-controls-sticky-wrapper geladen wird

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
  console.log("Rendering Home Component (Conditionally Sticky Controls)...");

  // --- Hooks und State Deklarationen ---
   const {
    annualRevenue, quarterlyRevenue, annualEPS, quarterlyEPS,
    annualDPS, quarterlyDPS,
    annualIncomeStatement, quarterlyIncomeStatement, annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement, annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    paysDividends,
    loading, error, progress, companyInfo, keyMetrics, fetchData
  } = useStockData();


  // States für Controls und App-Zustand
  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('quarterly');
  const [displayYears, setDisplayYears] = useState<number>(defaultYearsQuarterly);
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const prevLoadingRef = useRef<boolean>(loading);

  // --- Daten für Anzeige vorbereiten und slicen ---
  const incomeDataFromHook = viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement;
  const epsDataBase = viewMode === 'annual' ? annualEPS : quarterlyEPS;
  const dpsDataBase = viewMode === 'annual' ? annualDPS : quarterlyDPS;
  const marginsDataFromHook = viewMode === 'annual' ? annualMargins : quarterlyMargins;
  const cashflowStatementFromHook = viewMode === 'annual' ? annualCashflowStatement : quarterlyCashflowStatement;
  const sharesDataBase = viewMode === 'annual' ? annualSharesOutstanding : quarterlySharesOutstanding;
  const debtToEquityDataBase = viewMode === 'annual' ? annualDebtToEquity : quarterlyDebtToEquity;
  const totalDividendsDataBase = viewMode === 'annual' ? annualTotalDividendsPaid : quarterlyTotalDividendsPaid;

  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;

  // Slicing für alle Charts
  const incomeDataForChart = sliceMultiDataToLastNPoints(incomeDataFromHook, pointsToKeep);
  const epsDataMulti: MultiDatasetStockData = { labels: epsDataBase?.labels || [], datasets: [{ label: 'EPS', values: epsDataBase?.values || [] }] };
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataMulti, pointsToKeep);
  const marginsDataForChart = sliceMultiDataToLastNPoints(marginsDataFromHook, pointsToKeep);
  const cashflowStatementDataForChart = sliceMultiDataToLastNPoints(cashflowStatementFromHook, pointsToKeep);
  const sharesDataMulti: MultiDatasetStockData = { labels: sharesDataBase?.labels || [], datasets: [{ label: 'Shares Out (M)', values: sharesDataBase?.values || [] }]};
  const sharesDataForChart = sliceMultiDataToLastNPoints(sharesDataMulti, pointsToKeep);
  const debtToEquityDataMulti: MultiDatasetStockData = { labels: debtToEquityDataBase?.labels || [], datasets: [{ label: 'D/E Ratio', values: debtToEquityDataBase?.values || [] }]};
  const debtToEquityDataForChart = sliceMultiDataToLastNPoints(debtToEquityDataMulti, pointsToKeep);
  const dpsDataMulti: MultiDatasetStockData = { labels: dpsDataBase?.labels || [], datasets: [{ label: 'DPS ($)', values: dpsDataBase?.values || [] }]};
  const dpsDataForChart = sliceMultiDataToLastNPoints(dpsDataMulti, pointsToKeep);
  const totalDividendsDataMulti: MultiDatasetStockData = { labels: totalDividendsDataBase?.labels || [], datasets: [{ label: 'Total Dividends Paid', values: totalDividendsDataBase?.values || [] }]};
  const totalDividendsDataForChart = sliceMultiDataToLastNPoints(totalDividendsDataMulti, pointsToKeep);


  // --- Event Handlers ---
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
    // Reset der Jahre wird durch separaten useEffect gehandhabt
  };

  // --- useEffect Hooks ---
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
      // Reset der Jahre wird durch separaten useEffect gehandhabt
    }
  }, [currentTicker, fetchData]);
  useEffect(() => {
      console.log(`Effect ViewMode Change Triggered: Resetting displayYears for new mode '${viewMode}'`);
      setDisplayYears(viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly);
  }, [viewMode]);


  // --- Helper Functions ---
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

  // Aktuelle Jahresoptionen bestimmen
  const currentYearOptions = viewMode === 'annual' ? annualYearOptions : quarterlyYearOptions;

  // --- JSX Return ---
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>

        {/* Die separate Sticky Toolbar wurde ENTFERNT */}

        {/* Container für den Rest des Inhalts */}
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
              {companyInfo && (
                 <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} />
              )}
              {keyMetrics ? (
                 <KeyMetricsList keyMetrics={keyMetrics} />
               ) : (
                 companyInfo && !loading && ( // Zeige Fallback nur wenn Info da ist, aber Metriken fehlen
                    <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px' }}>
                       <IonItem lines="none"><IonLabel color="medium">Kennzahlen nicht verfügbar.</IonLabel></IonItem>
                    </IonList>
                 )
               )}

              {/* --- Steuerung & Charts (nur wenn Company Info geladen) --- */}
              {companyInfo && (
                 <>
                    {/* NEU: Wrapper für ChartControls, um Sticky-Verhalten zu ermöglichen */}
                    <div className="chart-controls-sticky-wrapper">
                      <ChartControls
                        viewMode={viewMode}
                        displayYears={displayYears}
                        yearOptions={currentYearOptions}
                        onViewModeChange={handleGlobalViewChange}
                        onYearsChange={handleGlobalYearsChange}
                      />
                    </div>

                    {/* ChartGrid Komponente */}
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

                    {/* Separate Grid für Dividenden-Charts */}
                    {(paysDividends || (dpsDataForChart && dpsDataForChart.labels && dpsDataForChart.labels.length > 0 && dpsDataForChart.datasets[0]?.values?.length > 0)) && (
                      <IonGrid fixed={true} style={{ marginTop: '0px' }}>
                        <IonRow>
                          {/* Total Dividends Paid Chart */}
                          {paysDividends ? ( <IonCol size="12" size-lg="6"> <TotalDividendsChartCard loading={loading} viewMode={viewMode} data={totalDividendsDataForChart} /> </IonCol> ) : ( <IonCol size="12" size-lg="6"></IonCol> )}
                          {/* Dividend Per Share Chart */}
                          {(dpsDataForChart && dpsDataForChart.labels && dpsDataForChart.labels.length > 0 && dpsDataForChart.datasets[0]?.values?.length > 0) ? ( <IonCol size="12" size-lg="6"> <DividendPerShareChartCard loading={loading} viewMode={viewMode} data={dpsDataForChart} /> </IonCol> ) : ( paysDividends && !loading ? ( <IonCol size="12" size-lg="6"> <IonCard style={{marginTop: '10px', textAlign: 'center', boxShadow: 'none', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><IonCardContent><p>Keine historischen Dividenden-pro-Aktie Daten verfügbar.</p></IonCardContent></IonCard> </IonCol> ) : ( <IonCol size="12" size-lg="6"></IonCol> ) )}
                        </IonRow>
                      </IonGrid>
                    )}
                 </>
              )} {/* Ende if(companyInfo) für Charts & Controls */}
            </>
          )} {/* Ende if(currentTicker && !error) */}

          {/* Platzhalter */}
          {!currentTicker && !loading && !error && (
            <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
              <p>Bitte geben Sie oben ein Aktiensymbol ein (z.B. AAPL, IBM).</p>
            </div>
          )}

        </div> {/* Ende des Haupt-Padding-Divs */}
      </IonContent>
    </IonPage>
  );
};
export default Home;
// --- Ende Home.tsx ---