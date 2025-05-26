// src/pages/Home.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonToast,
  IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText,
} from '@ionic/react';
import SearchBar from '../components/SearchBar';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorCard from '../components/ErrorCard';
import CompanyInfoCard from '../components/CompanyInfoCard';
import KeyMetricsList from '../components/KeyMetricsList';
import ChartControls from '../components/ChartControls';
import ChartGrid from '../components/ChartGrid';
import ExpandedChartModal from '../components/ExpandedChartModal';
// Importiere Typen
import { useStockData, StockData, CompanyInfo, KeyMetrics, MultiDatasetStockData } from '../hooks/useStockData';
// Importiere die Slicing-Funktion
import { sliceMultiDataToLastNPoints } from '../utils/utils';
import './Home.css';

// Definiere den Typ für yAxisFormat hier, um Konsistenz zu gewährleisten
type YAxisFormatType = 'currency' | 'percent' | 'number' | 'ratio';

// Optionen und Defaults für Jahresauswahl
const quarterlyYearOptions = [
    { value: 1, label: '1Y' }, { value: 2, label: '2Y' }, { value: 4, label: '4Y' }, { value: 10, label: 'MAX' }
];
const annualYearOptions = [
    { value: 5, label: '5Y' }, { value: 10, label: '10Y' }, { value: 15, label: '15Y' }, { value: 20, label: 'MAX' }
];
const defaultYearsQuarterly = 4; // Entspricht 4 * 4 = 16 Quartalen
const defaultYearsAnnual = 10;

// Interface für die Konfiguration des Modal-Charts
interface ModalChartConfig {
  title: string;
  yAxisFormat?: YAxisFormatType;
  yAxisLabel?: string;
}

const Home: React.FC = () => {
  console.log("Rendering Home Component (All Charts in ChartGrid)...");

  // --- Hooks und State Deklarationen ---
   const {
    annualRevenue, quarterlyRevenue, annualEPS, quarterlyEPS, // annualEPS & quarterlyEPS sind jetzt MultiDatasetStockData
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

  // States für das Chart-Modal
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [modalChartData, setModalChartData] = useState<MultiDatasetStockData | null>(null);
  const [modalChartConfig, setModalChartConfig] = useState<ModalChartConfig | null>(null);

  // --- Daten für Anzeige vorbereiten und slicen ---
  const incomeDataFromHook = viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement;
  
  // epsDataBase ist jetzt direkt MultiDatasetStockData aus dem Hook
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
  
  // Die künstliche Erzeugung von epsDataMulti ist nicht mehr nötig, da epsDataBase bereits MultiDatasetStockData ist.
  // const epsDataMulti: MultiDatasetStockData = { labels: epsDataBase?.labels || [], datasets: [{ label: 'EPS', values: epsDataBase?.values || [] }] }; // ENTFERNT oder angepasst
  const epsDataForChart = sliceMultiDataToLastNPoints(epsDataBase, pointsToKeep); // epsDataBase ist bereits MultiDatasetStockData

  const marginsDataForChart = sliceMultiDataToLastNPoints(marginsDataFromHook, pointsToKeep);
  const cashflowStatementDataForChart = sliceMultiDataToLastNPoints(cashflowStatementFromHook, pointsToKeep);
  
  // Für Shares, D/E, DPS und TotalDividendsPaid, die weiterhin als StockData kommen,
  // muss ggf. die Umwandlung in MultiDatasetStockData beibehalten werden, wenn sie so im ChartGrid erwartet werden.
  // Oder ChartGrid wird angepasst, um auch StockData für Einzel-Datensatz-Charts zu akzeptieren.
  // Aktuell erwartet ChartGrid MultiDatasetStockData für epsData, sharesData, debtToEquityData, dpsData, totalDividendsData
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
  };

  // Funktionen zum Steuern des Modals
  const openChartModal = ( data: MultiDatasetStockData, config: ModalChartConfig ) => {
    console.log("Opening chart modal for:", config.title);
    setModalChartData(data);
    setModalChartConfig(config);
    setIsChartModalOpen(true);
  };
  const closeChartModal = () => {
    console.log("Closing chart modal");
    setIsChartModalOpen(false);
  };

  // --- useEffect Hooks ---
  useEffect(() => {
     document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading && !error && currentTicker) {
      const hasData = companyInfo || annualRevenue?.labels?.length > 0 || annualEPS?.labels?.length > 0;
      if (hasData) {
        setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
      }
    }
    prevLoadingRef.current = loading; // Muss hier stehen, um den vorherigen Wert für den nächsten Render zu speichern
  }, [loading, error, currentTicker, companyInfo, annualRevenue, annualEPS]); // Abhängigkeiten erweitert

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker);
      setSuccessMessage('');
    }
  }, [currentTicker, fetchData]); // fetchData als Abhängigkeit hinzugefügt

  useEffect(() => {
      setDisplayYears(viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly);
  }, [viewMode]);

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string | null | undefined): string => {
    if (!marketCap || marketCap === 'None' || marketCap === '0') return 'N/A'; // '0' auch als N/A behandeln
    const num = parseFloat(marketCap);
    if(isNaN(num)) return 'N/A';
    if (num >= 1e12) { // Für Billionen (Trillions)
        return (num / 1e12).toFixed(2) + ' Bio. $';
    } else if (num >= 1e9) {
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

  const currentYearOptions = viewMode === 'annual' ? annualYearOptions : quarterlyYearOptions;

  // --- JSX Return ---
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>

        <div style={{ padding: '20px' }}> {/* Haupt-Padding-Container */}
          <SearchBar onSearch={handleSearch} />

          {loading && !companyInfo && <LoadingIndicator progress={progress} />}
          {typeof error === 'string' && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {currentTicker && !error && (
            <>
              {companyInfo && (
                <div className="info-metrics-container"> {/* Wrapper für Info und Metriken */}
                  <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} />
                  {keyMetrics ? ( 
                    <KeyMetricsList keyMetrics={keyMetrics} /> 
                  ) : ( 
                    !loading && ( 
                      <IonList inset={false} className="key-metrics-list" style={{marginTop: 'var(--spacing-lg)'}}> {/* inset=false für volles Styling, und eigener Margin falls alleinstehend */}
                        <IonItem lines="none"><IonLabel color="medium">Kennzahlen nicht verfügbar.</IonLabel></IonItem>
                      </IonList> 
                    )
                  )}
                </div>
              )}
              
              {/* Chart Controls und Grid nur anzeigen, wenn Basis-Infos da sind oder Ladevorgang nicht aktiv ist */}
              {(companyInfo || !loading) && (
                 <>
                    <div className="chart-controls-sticky-wrapper">
                      <ChartControls
                        viewMode={viewMode}
                        displayYears={displayYears}
                        yearOptions={currentYearOptions}
                        onViewModeChange={handleGlobalViewChange}
                        onYearsChange={handleGlobalYearsChange}
                      />
                    </div>

                    <ChartGrid
                       loading={loading} 
                       viewMode={viewMode}
                       incomeData={incomeDataForChart}
                       cashflowData={cashflowStatementDataForChart}
                       marginsData={marginsDataForChart}
                       epsData={epsDataForChart} // Wird jetzt MultiDatasetStockData mit "Reported" und "Estimated" sein
                       sharesData={sharesDataForChart}
                       debtToEquityData={debtToEquityDataForChart}
                       paysDividends={paysDividends} 
                       totalDividendsData={totalDividendsDataForChart} 
                       dpsData={dpsDataForChart} 
                       onExpandChart={openChartModal}
                    />
                 </>
              )}
            </>
          )}

          {!currentTicker && !loading && !error && (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-color-muted)' }}>
              <p>Bitte geben Sie oben ein Aktiensymbol ein (z.B. AAPL, IBM).</p>
            </div>
          )}
        </div>

        <ExpandedChartModal
          isOpen={isChartModalOpen}
          onClose={closeChartModal}
          chartTitle={modalChartConfig?.title}
          chartData={modalChartData}
          yAxisFormat={modalChartConfig?.yAxisFormat}
          yAxisLabel={modalChartConfig?.yAxisLabel}
        />
      </IonContent>
    </IonPage>
  );
};
export default Home;
// --- Ende Home.tsx ---