// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonToast } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import ChartModal from '../components/ChartModal';
import CompanyInfoCard from '../components/CompanyInfoCard';
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { useStockData, StockData } from '../hooks/useStockData';
import './Home.css';

interface ChartState {
  isModalOpen: boolean;
  isAnnualView: boolean;
  years: number;
  data: StockData;
}

const Home: React.FC = () => {
  const { annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, fetchData } = useStockData();

  const [charts, setCharts] = useState<{
    revenue: ChartState;
    eps: ChartState;
    fcf: ChartState;
  }>({
    revenue: { isModalOpen: false, isAnnualView: true, years: 10, data: { labels: [], values: [] } },
    eps: { isModalOpen: false, isAnnualView: true, years: 10, data: { labels: [], values: [] } },
    fcf: { isModalOpen: false, isAnnualView: true, years: 10, data: { labels: [], values: [] } },
  });

  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const mainChartData = annualData;
  const mainEPSData = annualEPS;
  const mainFCFData = annualFCF;

  useEffect(() => {
    document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  useEffect(() => {
    setCharts(prev => ({
      ...prev,
      revenue: { ...prev.revenue, data: prev.revenue.isAnnualView ? annualData : quarterlyData },
      eps: { ...prev.eps, data: prev.eps.isAnnualView ? annualEPS : quarterlyEPS },
      fcf: { ...prev.fcf, data: prev.fcf.isAnnualView ? annualFCF : quarterlyFCF },
    }));
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF]);

  useEffect(() => {
    if (!loading && !error && progress === 100 && (mainChartData.labels.length > 0 || mainEPSData.labels.length > 0 || mainFCFData.labels.length > 0)) {
      setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
    }
  }, [loading, error, progress, mainChartData, mainEPSData, mainFCFData, currentTicker]);

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker, charts.revenue.years);
    }
  }, [charts.revenue.years, fetchData, currentTicker]);

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker, charts.eps.years);
    }
  }, [charts.eps.years, fetchData, currentTicker]);

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker, charts.fcf.years);
    }
  }, [charts.fcf.years, fetchData, currentTicker]);

  const handleSearch = (query: string) => {
    setCurrentTicker(query.toUpperCase());
    setSuccessMessage('');
    fetchData(query, 10);
  };

  const handleRetry = () => {
    if (currentTicker) {
      fetchData(currentTicker, 10);
    }
  };

  const openModal = (chartType: 'revenue' | 'eps' | 'fcf') => {
    setCharts(prev => ({
      ...prev,
      [chartType]: { ...prev[chartType], isModalOpen: true },
    }));
  };

  const closeModal = (chartType: 'revenue' | 'eps' | 'fcf') => {
    setCharts(prev => ({
      ...prev,
      [chartType]: { ...prev[chartType], isModalOpen: false },
    }));
  };

  const handleViewToggle = (chartType: 'revenue' | 'eps' | 'fcf', isAnnual: boolean) => {
    setCharts(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        isAnnualView: isAnnual,
        data: isAnnual
          ? chartType === 'revenue'
            ? annualData
            : chartType === 'eps'
            ? annualEPS
            : annualFCF
          : chartType === 'revenue'
          ? quarterlyData
          : chartType === 'eps'
          ? quarterlyEPS
          : quarterlyFCF,
      },
    }));
  };

  const handleYearsChange = (chartType: 'revenue' | 'eps' | 'fcf', years: number) => {
    setCharts(prev => ({
      ...prev,
      [chartType]: { ...prev[chartType], years },
    }));
  };

  const formatMarketCap = (marketCap: string) => {
    const marketCapNumber = parseFloat(marketCap);
    if (isNaN(marketCapNumber)) return 'N/A';
    return (marketCapNumber / 1e9).toFixed(2) + ' Mrd. $';
  };

  const getErrorDetails = (errorMessage: string) => {
    let explanation = '';
    let recommendation = '';

    if (errorMessage.includes('Ungültiger Ticker') || errorMessage.includes('Keine Unternehmensinformationen')) {
      explanation = 'Der eingegebene Ticker existiert nicht oder ist nicht korrekt.';
      recommendation = 'Bitte überprüfen Sie den Ticker (z. B. „IBM“ für IBM) und versuchen Sie es erneut.';
    } else if (errorMessage.includes('API-Limit erreicht')) {
      explanation = 'Das API-Limit von Alpha Vantage (5 Aufrufe pro Minute) wurde erreicht. Sie haben zu viele Anfragen in kurzer Zeit gestellt.';
      recommendation = 'Bitte warten Sie eine Minute, bevor Sie es erneut versuchen, oder erwägen Sie die Verwendung eines Premium-API-Schlüssels für höhere Limits.';
    } else if (errorMessage.includes('Keine Umsatzdaten') || errorMessage.includes('Keine EPS-Daten') || errorMessage.includes('Keine Cashflow-Daten')) {
      explanation = 'Für diesen Ticker sind keine Finanzdaten verfügbar.';
      recommendation = 'Versuchen Sie einen anderen Ticker, z. B. „AAPL“ für Apple, oder überprüfen Sie, ob die Daten später verfügbar sind.';
    } else if (errorMessage.includes('API-Schlüssel nicht gefunden')) {
      explanation = 'Der API-Schlüssel für Alpha Vantage fehlt oder ist ungültig.';
      recommendation = 'Überprüfen Sie die .env-Datei und stellen Sie sicher, dass VITE_ALPHA_VANTAGE_API_KEY korrekt gesetzt ist.';
    } else {
      explanation = 'Ein unerwarteter Fehler ist aufgetreten.';
      recommendation = 'Bitte versuchen Sie es erneut. Falls der Fehler bestehen bleibt, kontaktieren Sie den Support.';
    }

    return { explanation, recommendation };
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Stock Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Stock Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {loading && <LoadingIndicator progress={progress} />}

          {error && (
            <ErrorCard
              error={error}
              getErrorDetails={getErrorDetails}
              onRetry={handleRetry}
            />
          )}

          <IonToast
            isOpen={!!successMessage}
            message={successMessage}
            duration={3000}
            color="success"
            position="top"
            onDidDismiss={() => setSuccessMessage('')}
          />

          {companyInfo && (
            <CompanyInfoCard
              companyInfo={companyInfo}
              ticker={currentTicker}
              formatMarketCap={formatMarketCap}
            />
          )}

          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="4">
                {mainChartData.labels.length > 0 ? (
                  <div className="chart-container" onClick={() => openModal('revenue')}>
                    <BarChart data={mainChartData} title="Revenue (Annual)" />
                  </div>
                ) : (
                  <p>Keine Umsatzdaten verfügbar.</p>
                )}
              </IonCol>
              <IonCol size="12" size-md="4">
                {mainEPSData.labels.length > 0 ? (
                  <div className="chart-container" onClick={() => openModal('eps')}>
                    <BarChart data={mainEPSData} title="EPS (Annual)" />
                  </div>
                ) : (
                  <p>Keine EPS-Daten verfügbar.</p>
                )}
              </IonCol>
              <IonCol size="12" size-md="4">
                {mainFCFData.labels.length > 0 ? (
                  <div className="chart-container" onClick={() => openModal('fcf')}>
                    <BarChart data={mainFCFData} title="FCF (Annual)" />
                  </div>
                ) : (
                  <p>Keine FCF-Daten verfügbar.</p>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          <ChartModal
            isOpen={charts.revenue.isModalOpen}
            onClose={() => closeModal('revenue')}
            title="Revenue"
            annualData={annualData}
            quarterlyData={quarterlyData}
            isAnnualView={charts.revenue.isAnnualView}
            setIsAnnualView={(isAnnual) => handleViewToggle('revenue', isAnnual)}
            years={charts.revenue.years}
            setYears={(years) => handleYearsChange('revenue', years)}
          />

          <ChartModal
            isOpen={charts.eps.isModalOpen}
            onClose={() => closeModal('eps')}
            title="EPS"
            annualData={annualEPS}
            quarterlyData={quarterlyEPS}
            isAnnualView={charts.eps.isAnnualView}
            setIsAnnualView={(isAnnual) => handleViewToggle('eps', isAnnual)}
            years={charts.eps.years}
            setYears={(years) => handleYearsChange('eps', years)}
          />

          <ChartModal
            isOpen={charts.fcf.isModalOpen}
            onClose={() => closeModal('fcf')}
            title="FCF"
            annualData={annualFCF}
            quarterlyData={quarterlyFCF}
            isAnnualView={charts.fcf.isAnnualView}
            setIsAnnualView={(isAnnual) => handleViewToggle('fcf', isAnnual)}
            years={charts.fcf.years}
            setYears={(years) => handleYearsChange('fcf', years)}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;