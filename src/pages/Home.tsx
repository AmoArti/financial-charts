// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonToast,
} from '@ionic/react';
import SearchBar from '../components/SearchBar';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorCard from '../components/ErrorCard';
import KeyStatsDashboard from '../components/KeyStatsDashboard';
import ChartControls from '../components/ChartControls';
import ChartGrid from '../components/ChartGrid';
import ExpandedChartModal from '../components/ExpandedChartModal';
// --- KORREKTUR HIER: Import aufgeteilt ---
import { useStockData } from '../hooks/useStockData';
import { MultiDatasetStockData, StockData } from '../types/stockDataTypes';
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
  // --- Hooks und State Deklarationen ---
   const {
    annualIncomeStatement, quarterlyIncomeStatement,
    annualCashflowStatement, quarterlyCashflowStatement,
    annualMargins, quarterlyMargins,
    annualEPS, quarterlyEPS,
    annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    annualDPS, quarterlyDPS,
    paysDividends, balanceSheetMetrics,
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
  const [modalConfig, setModalConfig] = useState<ModalChartConfig | null>(null);

  // --- Daten für Anzeige vorbereiten und slicen ---
  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;
  
  const incomeData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement, pointsToKeep);
  const cashflowData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualCashflowStatement : quarterlyCashflowStatement, pointsToKeep);
  const marginsData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualMargins : quarterlyMargins, pointsToKeep);
  const epsData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualEPS : quarterlyEPS, pointsToKeep);
  
  const toMulti = (d: StockData, label: string): MultiDatasetStockData => ({
      labels: d?.labels || [],
      datasets: [{ label, values: d?.values || [] }],
  });
  
  const sharesDataRaw = viewMode === 'annual' ? annualSharesOutstanding : quarterlySharesOutstanding;
  const sharesData = sliceMultiDataToLastNPoints(toMulti(sharesDataRaw, 'Shares Out (M)'), pointsToKeep);
  
  const debtToEquityDataRaw = viewMode === 'annual' ? annualDebtToEquity : quarterlyDebtToEquity;
  const debtToEquityData = sliceMultiDataToLastNPoints(toMulti(debtToEquityDataRaw, 'D/E Ratio'), pointsToKeep);

  const totalDividendsDataRaw = viewMode === 'annual' ? annualTotalDividendsPaid : quarterlyTotalDividendsPaid;
  const totalDividendsData = sliceMultiDataToLastNPoints(toMulti(totalDividendsDataRaw, 'Total Dividends Paid'), pointsToKeep);
  
  const dpsDataRaw = viewMode === 'annual' ? annualDPS : quarterlyDPS;
  const dpsData = sliceMultiDataToLastNPoints(toMulti(dpsDataRaw, 'DPS ($)'), pointsToKeep);

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

  const openChartModal = (data: MultiDatasetStockData, config: ModalChartConfig ) => {
    setModalChartData(data);
    setModalConfig(config);
    setIsChartModalOpen(true);
  };
  const closeChartModal = () => setIsChartModalOpen(false);

  // --- useEffect Hooks ---
  useEffect(() => {
     document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading && !error && currentTicker) {
      const hasData = companyInfo?.Name;
      if (hasData) {
        setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
      }
    }
    prevLoadingRef.current = loading;
  }, [loading, error, currentTicker, companyInfo]);

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker);
      setSuccessMessage('');
    }
  }, [currentTicker, fetchData]);

  useEffect(() => {
      setDisplayYears(viewMode === 'annual' ? defaultYearsAnnual : defaultYearsQuarterly);
  }, [viewMode]);

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string | null | undefined): string => {
    if (!marketCap || marketCap === 'None' || marketCap === '0') return 'N/A';
    const num = parseFloat(marketCap);
    if(isNaN(num)) return 'N/A';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toFixed(0);
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
      <IonContent fullscreen>
        <div className="main-content-wrapper">
          <h1 className="main-title">Stock Dashboard</h1>
          <SearchBar onSearch={handleSearch} />

          {loading && !companyInfo && <LoadingIndicator progress={progress} />}
          {error && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {currentTicker && !error && (
            <>
              <KeyStatsDashboard
                companyInfo={companyInfo}
                keyMetrics={keyMetrics}
                balanceSheetMetrics={balanceSheetMetrics}
                ticker={currentTicker}
                formatMarketCap={formatMarketCap}
              />

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
                       incomeData={incomeData}
                       cashflowData={cashflowData}
                       marginsData={marginsData}
                       epsData={epsData}
                       sharesData={sharesData}
                       debtToEquityData={debtToEquityData}
                       paysDividends={paysDividends}
                       totalDividendsData={totalDividendsData}
                       dpsData={dpsData}
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
          chartTitle={modalConfig?.title}
          chartData={modalChartData}
          yAxisFormat={modalConfig?.yAxisFormat}
          yAxisLabel={modalConfig?.yAxisLabel}
        />
      </IonContent>
    </IonPage>
  );
};
export default Home;