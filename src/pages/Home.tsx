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
import { useStockData } from '../hooks/useStockData';
import { MultiDatasetStockData, StockData } from '../types/stockDataTypes';
import { sliceMultiDataToLastNPoints } from '../utils/utils';
import './Home.css';

type YAxisFormatType = 'currency' | 'percent' | 'number' | 'ratio';

const quarterlyYearOptions = [
    { value: 1, label: '1Y' }, { value: 2, label: '2Y' }, { value: 4, label: '4Y' }, { value: 10, label: 'MAX' }
];
const annualYearOptions = [
    { value: 5, label: '5Y' }, { value: 10, label: '10Y' }, { value: 15, label: '15Y' }, { value: 20, label: 'MAX' }
];
const defaultYearsQuarterly = 4;
const defaultYearsAnnual = 10;

interface ModalChartConfig {
  title: string;
  yAxisFormat?: YAxisFormatType;
  yAxisLabel?: string;
  chartId?: string;
}

const Home: React.FC = () => {
   const {
    annualIncomeStatement, quarterlyIncomeStatement,
    annualCashflowStatement, quarterlyCashflowStatement,
    annualMargins, quarterlyMargins,
    annualEPS, quarterlyEPS,
    annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    annualDPS, quarterlyDPS,
    annualFCF, quarterlyFCF,
    annualFCFPerShare, quarterlyFCFPerShare,
    annualPriceToFcf, quarterlyPriceToFcf,
    paysDividends, balanceSheetMetrics,
    loading, error, progress, companyInfo, keyMetrics, fetchData
  } = useStockData();

  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('quarterly');
  const [displayYears, setDisplayYears] = useState<number>(defaultYearsQuarterly);
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const prevLoadingRef = useRef<boolean>(loading);

  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [modalChartId, setModalChartId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ModalChartConfig | null>(null);

  const pointsToKeep = viewMode === 'annual' ? displayYears : displayYears * 4;
  
  const toMulti = (d: StockData, label: string): MultiDatasetStockData => ({
      labels: d?.labels || [],
      datasets: [{ label, values: d?.values || [] }],
  });
  
  const incomeData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualIncomeStatement : quarterlyIncomeStatement, pointsToKeep);
  const cashflowData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualCashflowStatement : quarterlyCashflowStatement, pointsToKeep);
  const marginsData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualMargins : quarterlyMargins, pointsToKeep);
  const epsData = sliceMultiDataToLastNPoints(viewMode === 'annual' ? annualEPS : quarterlyEPS, pointsToKeep);
  const sharesData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualSharesOutstanding : quarterlySharesOutstanding, 'Shares Out (M)'), pointsToKeep);
  const debtToEquityData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualDebtToEquity : quarterlyDebtToEquity, 'D/E Ratio'), pointsToKeep);
  const totalDividendsData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualTotalDividendsPaid : quarterlyTotalDividendsPaid, 'Total Dividends Paid'), pointsToKeep);
  const dpsData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualDPS : quarterlyDPS, 'DPS ($)'), pointsToKeep);
  const fcfAbsData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualFCF : quarterlyFCF, 'Free Cash Flow ($B)'), pointsToKeep);
  const fcfPerShareData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualFCFPerShare : quarterlyFCFPerShare, 'FCF per Share ($)'), pointsToKeep);
  const priceToFcfData = sliceMultiDataToLastNPoints(toMulti(viewMode === 'annual' ? annualPriceToFcf : quarterlyPriceToFcf, 'P/FCF'), pointsToKeep);

  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  // ... (restliche Handler bleiben gleich)
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

  const openChartModal = (chartId: string, config: ModalChartConfig ) => {
    setModalChartId(chartId);
    setModalConfig(config);
    setIsChartModalOpen(true);
  };
  const closeChartModal = () => setIsChartModalOpen(false);

  // ... (useEffect und Helper-Funktionen bleiben gleich) ...
  
  useEffect(() => {
     document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading && !error && currentTicker) {
      if (companyInfo?.Name) {
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
                       fcfAbsData={fcfAbsData}
                       priceToFcfData={priceToFcfData}
                       onExpandChart={openChartModal}
                    />
                 </>
              )}
            </>
          )}
        </div>

        <ExpandedChartModal
          isOpen={isChartModalOpen}
          onClose={closeChartModal}
          chartId={modalChartId}
          config={modalConfig}
          dataSources={{
            income: incomeData,
            cashflow: cashflowData,
            margins: marginsData,
            eps: epsData,
            shares: sharesData,
            debtToEquity: debtToEquityData,
            totalDividends: totalDividendsData,
            dps: dpsData,
            fcf: fcfAbsData,
            fcfPerShare: fcfPerShareData,
            pfcf: priceToFcfData,
          }}
        />
      </IonContent>
    </IonPage>
  );
};
export default Home;