// src/pages/Home.tsx (Final - Mit allen Charts inkl. Debt-to-Equity)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonToast,
  IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText,
  IonSegment, IonSegmentButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import SearchBar from '../components/SearchBar';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorCard from '../components/ErrorCard';
import CompanyInfoCard from '../components/CompanyInfoCard';
import BarChart from '../components/BarChart';
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
  console.log("Rendering Home Component (Final with D/E Chart)...");

  // --- Hooks und State Deklarationen ---
  const {
    annualRevenue, quarterlyRevenue, annualEPS, quarterlyEPS,
    annualIncomeStatement, quarterlyIncomeStatement, annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement, annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity, // D/E Daten holen
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
  const marginsDataFromHook = viewMode === 'annual' ? annualMargins : quarterlyMargins;
  const cashflowStatementFromHook = viewMode === 'annual' ? annualCashflowStatement : quarterlyCashflowStatement;
  const sharesDataBase = viewMode === 'annual' ? annualSharesOutstanding : quarterlySharesOutstanding;
  const debtToEquityDataBase = viewMode === 'annual' ? annualDebtToEquity : quarterlyDebtToEquity; // D/E Daten auswählen

  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;

  // Slicing für alle Charts
  const incomeDataForChart = sliceMultiDataToLastNPoints(incomeDataFromHook, pointsToKeep);
  const epsDataMulti: MultiDatasetStockData = { labels: epsDataBase?.labels || [], datasets: [{ label: 'EPS', values: epsDataBase?.values || [] }] };
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataMulti, pointsToKeep);
  const marginsDataForChart = sliceMultiDataToLastNPoints(marginsDataFromHook, pointsToKeep);
  const cashflowStatementDataForChart = sliceMultiDataToLastNPoints(cashflowStatementFromHook, pointsToKeep);
  const sharesDataMulti: MultiDatasetStockData = { labels: sharesDataBase?.labels || [], datasets: [{ label: 'Shares Out (M)', values: sharesDataBase?.values || [] }]};
  const sharesDataForChart = sliceMultiDataToLastNPoints(sharesDataMulti, pointsToKeep);
  const debtToEquityDataMulti: MultiDatasetStockData = {
      labels: debtToEquityDataBase?.labels || [],
      datasets: [{ label: 'D/E Ratio', values: debtToEquityDataBase?.values || [] }]
  };
  const debtToEquityDataForChart = sliceMultiDataToLastNPoints(debtToEquityDataMulti, pointsToKeep); // D/E Daten slicen


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
    const newDefaultYears = newViewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly;
    setDisplayYears(newDefaultYears);
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
      setDisplayYears(viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly);
    }
  }, [currentTicker, viewMode, fetchData]);

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
              <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
                 {keyMetrics && (
                   <>
                     <IonItem lines="full"><IonLabel color="medium">Kennzahlen</IonLabel></IonItem>
                     <IonItem><IonLabel>KGV (P/E Ratio)</IonLabel><IonNote slot="end">{keyMetrics.peRatio ?? 'N/A'}</IonNote></IonItem>
                     <IonItem><IonLabel>KUV (P/S Ratio)</IonLabel><IonNote slot="end">{keyMetrics.psRatio ?? 'N/A'}</IonNote></IonItem>
                     <IonItem><IonLabel>KBV (P/B Ratio)</IonLabel><IonNote slot="end">{keyMetrics.pbRatio ?? 'N/A'}</IonNote></IonItem>
                     <IonItem><IonLabel>EV/EBITDA</IonLabel><IonNote slot="end">{keyMetrics.evToEbitda ?? 'N/A'}</IonNote></IonItem>
                     <IonItem><IonLabel>Bruttomarge</IonLabel><IonNote slot="end">{keyMetrics.grossMargin ?? 'N/A'}</IonNote></IonItem>
                     <IonItem><IonLabel>Operative Marge</IonLabel><IonNote slot="end">{keyMetrics.operatingMargin ?? 'N/A'}</IonNote></IonItem>
                     <IonItem lines="none"><IonLabel>Dividendenrendite</IonLabel><IonNote slot="end">{keyMetrics.dividendYield ?? 'N/A'}</IonNote></IonItem>
                   </>
                 )}
                 {!keyMetrics && companyInfo && !loading && (
                    <IonItem lines="none"><IonLabel color="medium">Kennzahlen nicht verfügbar.</IonLabel></IonItem>
                 )}
              </IonList>

              {/* --- Steuerung & Charts (nur wenn Company Info geladen) --- */}
              {companyInfo && (
                 <>
                    {/* Globale Bedienelemente */}
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

                    {/* Bereich für die Charts */}
                    <div style={{ marginTop: '10px' }}>
                      {/* Income Statement Chart */}
                      <IonCard>
                        <IonCardHeader><IonCardTitle>Income Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                        <IonCardContent>
                          {incomeDataForChart && incomeDataForChart.labels && incomeDataForChart.labels.length > 0 && incomeDataForChart.datasets.length > 0 ? (
                            <div style={{ height: '300px', width: '100%' }}>
                              <BarChart
                                data={incomeDataForChart}
                                title={`Income Statement (${viewMode})`}
                                yAxisFormat="currency"
                                yAxisLabel="Billions ($B)" />
                            </div>)
                          : !loading && (<p>Keine Income Statement Daten verfügbar.</p>)}
                        </IonCardContent>
                      </IonCard>

                      {/* Cashflow Statement Chart */}
                      <IonCard>
                        <IonCardHeader><IonCardTitle>Cash Flow Statement ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                        <IonCardContent>
                          {cashflowStatementDataForChart && cashflowStatementDataForChart.labels && cashflowStatementDataForChart.labels.length > 0 && cashflowStatementDataForChart.datasets.length > 0 ? (
                              <div style={{ height: '300px', width: '100%' }}>
                                  <BarChart
                                      data={cashflowStatementDataForChart}
                                      title={`Cash Flow (${viewMode})`}
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
                          {marginsDataForChart && marginsDataForChart.labels && marginsDataForChart.labels.length > 0 && marginsDataForChart.datasets.length > 0 ? (
                            <div style={{ height: '300px', width: '100%' }}>
                              <BarChart
                                data={marginsDataForChart}
                                title={`Margins (%) (${viewMode})`}
                                yAxisFormat="percent"
                                yAxisLabel="Margin (%)" />
                            </div>)
                          : !loading && (<p>Keine Margen-Daten verfügbar.</p>)}
                        </IonCardContent>
                      </IonCard>

                      {/* EPS Chart */}
                      <IonCard>
                        <IonCardHeader><IonCardTitle>EPS ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                        <IonCardContent>
                          {epsDataForChart && epsDataForChart.labels && epsDataForChart.labels.length > 0 && epsDataForChart.datasets[0]?.values?.length > 0 ? (
                            <div style={{ height: '300px', width: '100%' }}>
                              <BarChart
                                data={epsDataForChart}
                                title={`EPS (${viewMode})`}
                                yAxisFormat="number"
                                yAxisLabel="EPS ($)" />
                            </div> )
                          : !loading && (<p>Keine EPS Daten verfügbar.</p>)}
                        </IonCardContent>
                      </IonCard>

                      {/* Shares Outstanding Chart */}
                      <IonCard>
                        <IonCardHeader><IonCardTitle>Outstanding Shares ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                        <IonCardContent>
                          {sharesDataForChart && sharesDataForChart.labels && sharesDataForChart.labels.length > 0 && sharesDataForChart.datasets[0]?.values?.length > 0 ? (
                             <div style={{ height: '300px', width: '100%' }}>
                                <BarChart
                                    data={sharesDataForChart}
                                    title={`Outstanding Shares (${viewMode})`}
                                    // *** HIER die Änderung ***
                                    yAxisFormat="ratio" // War vorher "number", "ratio" nutzt toFixed(2)
                                    yAxisLabel="Shares (Millions)"
                                />
                             </div>
                           ) : !loading && (
                             <p>Keine Daten zu ausstehenden Aktien verfügbar.</p>
                           )}
                        </IonCardContent>
                      </IonCard>

                      {/* Debt-to-Equity Ratio Chart */}
                      <IonCard>
                        <IonCardHeader><IonCardTitle>Debt-to-Equity Ratio ({viewMode === 'annual' ? 'Annual' : 'Quarterly'})</IonCardTitle></IonCardHeader>
                        <IonCardContent>
                          {debtToEquityDataForChart && debtToEquityDataForChart.labels && debtToEquityDataForChart.labels.length > 0 && debtToEquityDataForChart.datasets[0]?.values?.length > 0 ? (
                             <div style={{ height: '300px', width: '100%' }}>
                                <BarChart
                                    data={debtToEquityDataForChart}
                                    title={`Debt-to-Equity Ratio (${viewMode})`}
                                    // *** HIER die Änderung ***
                                    yAxisFormat="ratio" // War vorher "number"
                                    yAxisLabel="D/E Ratio"
                                />
                             </div>
                           ) : !loading && (
                             <p>Keine Debt-to-Equity Daten verfügbar.</p>
                           )}
                        </IonCardContent>
                      </IonCard>

                    </div>
                 </>
              )} {/* Ende if(companyInfo) */}
            </>
          )} {/* Ende if(currentTicker && !error) */}

          {/* Platzhalter (falls kein Ticker gesucht wurde) */}
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