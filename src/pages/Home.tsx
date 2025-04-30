// src/pages/Home.tsx (Angepasst für korrekte Hook-Daten & neuen Cashflow-Chart)
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
// Importiere alles Notwendige aus dem Hook (Typen sollten jetzt passen)
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
  // --- Hooks und State Deklarationen ---
  // KORRIGIERTES DESTRUCTURING:
  const {
    annualRevenue,           // Umbenannt
    quarterlyRevenue,        // Umbenannt
    annualEPS,
    quarterlyEPS,
    annualIncomeStatement,
    quarterlyIncomeStatement,
    annualMargins,
    quarterlyMargins,
    annualCashflowStatement, // NEU
    quarterlyCashflowStatement,// NEU
    loading,
    error,
    progress,
    companyInfo,
    keyMetrics,
    fetchData
  } = useStockData(); // Der Hook sollte diese Struktur jetzt liefern

  // States für Controls und App-Zustand
  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('quarterly');
  const [displayYears, setDisplayYears] = useState<number>(defaultYearsQuarterly);
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const prevLoadingRef = useRef<boolean>(loading);

  // --- Daten für Anzeige vorbereiten und slicen ---
  // Wähle die korrekten Datenquellen basierend auf viewMode
  const incomeDataFromHook = viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement;
  const epsDataBase = viewMode === 'annual' ? annualEPS : quarterlyEPS;
  // Alte fcfDataBase entfernt
  const marginsDataFromHook = viewMode === 'annual' ? annualMargins : quarterlyMargins;
  const cashflowStatementFromHook = viewMode === 'annual' ? annualCashflowStatement : quarterlyCashflowStatement; // NEU

  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;

  // Daten für die Charts slicen
  const incomeDataForChart = sliceMultiDataToLastNPoints(incomeDataFromHook, pointsToKeep);
  // EPS Daten für BarChart vorbereiten (bleibt gleich)
  const epsDataMulti: MultiDatasetStockData = { labels: epsDataBase.labels || [], datasets: [{ label: 'EPS', values: epsDataBase.values || [] }] };
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataMulti, pointsToKeep);
  // Alte fcfDataMulti und fcfDataForChart entfernt
  const marginsDataForChart = sliceMultiDataToLastNPoints(marginsDataFromHook, pointsToKeep);
  // NEU: Cashflow Statement Daten slicen
  const cashflowStatementDataForChart = sliceMultiDataToLastNPoints(cashflowStatementFromHook, pointsToKeep);

  // --- useEffect Hooks ---
  // Setzt den Dokumenttitel
  useEffect(() => { document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard"; }, [currentTicker]);

  // Zeigt Erfolgsmeldung an
  useEffect(() => {
    if (prevLoadingRef.current && !loading && !error && currentTicker) {
      // Prüft jetzt incomeDataForChart.labels, was definiert sein sollte, wenn loading false ist.
      const hasIncomeData = incomeDataForChart?.labels?.length > 0;
      if(hasIncomeData) {
        setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
      }
    }
    // incomeDataForChart bleibt als Dependency, da es das Ergebnis der Verarbeitung ist
  }, [loading, error, currentTicker, incomeDataForChart]);

  // Speichert den vorherigen Ladezustand
  useEffect(() => { prevLoadingRef.current = loading; });

  // Holt initiale Daten, wenn sich der Ticker ändert
  useEffect(() => {
    if (currentTicker) {
      console.log(`[Home useEffect - Ticker Change] Fetching initial data for ${currentTicker}`);
      fetchData(currentTicker); // Holt MAX Daten
      setSuccessMessage('');
      // Setzt Jahresauswahl auf Default für den aktuellen viewMode zurück, wenn Ticker wechselt
      setDisplayYears(viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly);
    } else {
      // Optional: States zurücksetzen, wenn kein Ticker da ist
    }
  }, [currentTicker, viewMode, fetchData]); // Dependencies bleiben gleich

  // --- Event Handlers ---
  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  const handleRetry = () => { if (currentTicker) { fetchData(currentTicker); } };

  // Handler für globale Jahresauswahl (ändert nur State)
  const handleGlobalYearsChange = (newYearsString: string | undefined) => {
    if (newYearsString === undefined) return;
    const newYears = parseInt(newYearsString, 10);
    if (isNaN(newYears) || newYears === displayYears) return;
    console.log(`[Home handleGlobalYearsChange] Display years changed to ${newYears}`);
    setDisplayYears(newYears);
  };

  // Handler für globale Ansicht (Setzt jetzt explizit Jahre zurück)
  const handleGlobalViewChange = (newViewMode: 'annual' | 'quarterly' | undefined) => {
    if (newViewMode === undefined || (newViewMode !== 'annual' && newViewMode !== 'quarterly') || newViewMode === viewMode) return;
    console.log(`[Home handleGlobalViewChange] View changed to ${newViewMode}`);
    setViewMode(newViewMode);
    const newDefaultYears = newViewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly;
    console.log(`  >> Resetting displayYears to default: ${newDefaultYears}`);
    setDisplayYears(newDefaultYears);
  };

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string | null | undefined): string => {
    if (!marketCap) return 'N/A';
    const num = parseFloat(marketCap);
    if(isNaN(num)) return 'N/A';
    return (num / 1e9).toFixed(2) + ' Mrd. $';
  };
  const getErrorDetails = (errorMessage: string | null): { explanation: string; recommendation: string } => {
    let explanation = 'Ein Fehler ist aufgetreten.';
    let recommendation = 'Bitte versuchen Sie es erneut oder laden Sie die Seite neu.';
    const safeErrorMessage = errorMessage || "";

    if (safeErrorMessage.includes('API-Fehler bei') || safeErrorMessage.includes('Ungültiger Ticker')) { explanation = 'Der eingegebene Ticker wurde nicht gefunden oder ist ungültig.'; recommendation = 'Bitte überprüfen Sie die Schreibweise (z.B. AAPL für Apple).'; }
    else if (safeErrorMessage.includes('API-Limit erreicht')) { explanation = 'Das Abfragelimit für die API wurde erreicht (Alpha Vantage Free Tier).'; recommendation = 'Bitte warten Sie eine Minute und versuchen Sie es erneut.'; }
    else if (safeErrorMessage.includes('Keine Finanzdaten') || safeErrorMessage.includes('Keine Unternehmensinformationen') || safeErrorMessage.includes('Kein aktueller Aktienkurs')) { explanation = `Für den Ticker "${currentTicker || ''}" konnten notwendige Daten nicht gefunden werden.`; recommendation = 'Möglicherweise werden für diesen Ticker nicht alle Daten von Alpha Vantage bereitgestellt.'; }
    else if (safeErrorMessage.includes('API-Schlüssel nicht gefunden')) { explanation = 'Der API-Schlüssel für Alpha Vantage fehlt.'; recommendation = 'Bitte überprüfen Sie die Konfiguration (z.B. .env Datei).'}
    else if (safeErrorMessage) {
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

          {/* Company Info Card */}
          {companyInfo && ( <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} /> )}

          {/* Key Metrics Liste */}
          {keyMetrics && (
            <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
              <IonItem lines="full"><IonLabel color="medium">Kennzahlen</IonLabel></IonItem>
              <IonItem><IonLabel>KGV (P/E Ratio)</IonLabel><IonNote slot="end">{keyMetrics.peRatio ?? 'N/A'}</IonNote></IonItem>
              <IonItem><IonLabel>KUV (P/S Ratio)</IonLabel><IonNote slot="end">{keyMetrics.psRatio ?? 'N/A'}</IonNote></IonItem>
              <IonItem><IonLabel>KBV (P/B Ratio)</IonLabel><IonNote slot="end">{keyMetrics.pbRatio ?? 'N/A'}</IonNote></IonItem>
              <IonItem><IonLabel>EV/EBITDA</IonLabel><IonNote slot="end">{keyMetrics.evToEbitda ?? 'N/A'}</IonNote></IonItem>
              <IonItem><IonLabel>Bruttomarge</IonLabel><IonNote slot="end">{keyMetrics.grossMargin ?? 'N/A'}</IonNote></IonItem>
              <IonItem><IonLabel>Operative Marge</IonLabel><IonNote slot="end">{keyMetrics.operatingMargin ?? 'N/A'}</IonNote></IonItem>
              <IonItem lines="none"><IonLabel>Dividendenrendite</IonLabel><IonNote slot="end">{keyMetrics.dividendYield ?? 'N/A'}</IonNote></IonItem>
            </IonList>
          )}

          {/* Globale Bedienelemente */}
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

          {/* Bereich für die direkt angezeigten Charts */}
          {!error && currentTicker && companyInfo && (
            <div style={{ marginTop: '10px' }}>

              {/* Income Statement Chart */}
              <IonCard>
                <IonCardHeader><IonCardTitle>Income Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                  {incomeDataForChart.labels.length > 0 && incomeDataForChart.datasets.length > 0 ? ( <div style={{ height: '300px', width: '100%' }}><BarChart data={incomeDataForChart} title={`Income Statement (${viewMode})`} yAxisFormat="currency" yAxisLabel="Billions ($B)" /></div>)
                  : !loading && (<p>Keine Income Statement Daten verfügbar.</p>)}
                </IonCardContent>
              </IonCard>

              {/* NEU: Cashflow Statement Chart */}
              <IonCard>
                  <IonCardHeader><IonCardTitle>Cash Flow Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                  <IonCardContent>
                      {cashflowStatementDataForChart.labels.length > 0 && cashflowStatementDataForChart.datasets.length > 0 ? (
                          <div style={{ height: '300px', width: '100%' }}>
                              <BarChart
                                  data={cashflowStatementDataForChart}
                                  title={`Cash Flow (${viewMode})`} // Interner Titel, nicht unbedingt sichtbar
                                  yAxisFormat="currency"
                                  yAxisLabel="Billions ($B)"
                              />
                          </div>
                      ) : !loading && (
                          <p>Keine Cashflow Daten verfügbar.</p>
                      )}
                  </IonCardContent>
              </IonCard>

              {/* Margins Chart */}
              <IonCard>
                <IonCardHeader><IonCardTitle>Margins ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                  {marginsDataForChart.labels.length > 0 && marginsDataForChart.datasets.length > 0 ? ( <div style={{ height: '300px', width: '100%' }}><BarChart data={marginsDataForChart} title={`Margins (%) (${viewMode})`} yAxisFormat="percent" yAxisLabel="Margin (%)" /></div>)
                  : !loading && (<p>Keine Margen-Daten verfügbar.</p>)}
                </IonCardContent>
              </IonCard>

              {/* EPS Chart */}
              <IonCard>
                <IonCardHeader><IonCardTitle>EPS ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                <IonCardContent>
                  {epsDataForChart.labels.length > 0 && epsDataForChart.datasets[0]?.values?.length > 0 ? ( <div style={{ height: '300px', width: '100%' }}><BarChart data={epsDataForChart} title={`EPS (${viewMode})`} yAxisFormat="number" yAxisLabel="EPS ($)" /></div> )
                  : !loading && (<p>Keine EPS Daten verfügbar.</p>)}
                </IonCardContent>
              </IonCard>

              {/* ALTER FCF Chart wurde entfernt */}

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