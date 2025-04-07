// src/pages/Home.tsx (Mit Debugging in handleYearsChange)
import React, { useState, useEffect, useCallback } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonToast, IonList, IonItem, IonLabel, IonNote } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import ChartModal from '../components/ChartModal';
import CompanyInfoCard from '../components/CompanyInfoCard';
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { useStockData, StockData, CompanyInfo, KeyMetrics } from '../hooks/useStockData';
import './Home.css';

interface ChartState {
  isModalOpen: boolean;
  isAnnualView: boolean;
  years: number;
}

const Home: React.FC = () => {
  const { annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, keyMetrics, fetchData } = useStockData();

  const [charts, setCharts] = useState<{
    revenue: ChartState; eps: ChartState; fcf: ChartState;
  }>({
    revenue: { isModalOpen: false, isAnnualView: true, years: 10 },
    eps: { isModalOpen: false, isAnnualView: true, years: 10 },
    fcf: { isModalOpen: false, isAnnualView: true, years: 10 },
  });
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [maxYearsFetched, setMaxYearsFetched] = useState<number>(0);

  const mainChartData = annualData; const mainEPSData = annualEPS; const mainFCFData = annualFCF;

  useEffect(() => { document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard"; }, [currentTicker]);
  useEffect(() => { if (!loading && !error && progress === 100 && currentTicker && (mainChartData.labels.length > 0 || mainEPSData.labels.length > 0 || mainFCFData.labels.length > 0)) { setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`); } }, [loading, error, progress, mainChartData, mainEPSData, mainFCFData, currentTicker]);

  useEffect(() => {
    if (currentTicker) {
      const initialFetchYears = 10;
      // console.log(`Optimized Home: Fetching initial data for ${currentTicker} for ${initialFetchYears} years.`);
      fetchData(currentTicker, initialFetchYears);
      setMaxYearsFetched(initialFetchYears);
      setSuccessMessage('');
       setCharts(prev => ({
           revenue: { ...prev.revenue, years: initialFetchYears },
           eps: { ...prev.eps, years: initialFetchYears },
           fcf: { ...prev.fcf, years: initialFetchYears },
       }));
    } else {
      setMaxYearsFetched(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicker, fetchData]); // fetchData als Dep ist ok, wenn im Hook stabilisiert

  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  const handleRetry = () => { if (currentTicker) { const yearsToRetry = maxYearsFetched > 0 ? maxYearsFetched : 10; fetchData(currentTicker, yearsToRetry); } };
  const openModal = (chartType: 'revenue' | 'eps' | 'fcf') => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: true }, })); };
  const closeModal = (chartType: 'revenue' | 'eps' | 'fcf') => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: false }, })); };
  const handleViewToggle = (chartType: 'revenue' | 'eps' | 'fcf', isAnnual: boolean) => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isAnnualView: isAnnual, }, })); };

  const handleYearsChange = (chartType: 'revenue' | 'eps' | 'fcf', years: number) => {
    // *** DEBUGGING HIER ***
    console.log(`[handleYearsChange DEBUG] Called for ${chartType}. Received years: ${years}, currentTicker: '${currentTicker}', maxYearsFetched: ${maxYearsFetched}`);
    const shouldFetch = currentTicker && years > maxYearsFetched;
    console.log(`[handleYearsChange DEBUG] Condition (currentTicker && years > maxYearsFetched) is: ${shouldFetch}`);
    // *** ENDE DEBUGGING ***

    setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], years }, })); // Update gewünschte Jahre

    if (shouldFetch) { // Verwende die berechnete Variable
      console.log(`Optimized Home: Fetching additional data for ${currentTicker} for ${years} years (max fetched: ${maxYearsFetched}).`);
      setMaxYearsFetched(years); // State *vor* dem async Call setzen
      fetchData(currentTicker, years);
    } else {
      console.log(`Optimized Home: No new fetch needed for ${years} years (max fetched: ${maxYearsFetched}).`);
    }
  };

  const formatMarketCap = (marketCap: string) => { const num = parseFloat(marketCap); if(isNaN(num)) return 'N/A'; return (num / 1e9).toFixed(2) + ' Mrd. $'; };
  const getErrorDetails = (errorMessage: string) => {
     let explanation = ''; let recommendation = '';
     if (errorMessage.includes('Ungültiger Ticker')) { explanation = 'Ticker nicht korrekt.'; recommendation = 'Prüfen Sie den Ticker.'; }
     else if (errorMessage.includes('API-Limit erreicht')) { explanation = 'API-Limit erreicht.'; recommendation = 'Warte eine Minute.'; }
     else if (errorMessage.includes('Keine ') && errorMessage.includes('Daten')) { explanation = `Für ${currentTicker} sind diese Daten nicht verfügbar.`; recommendation = 'Anderen Ticker versuchen.';}
     else if (errorMessage.includes('API-Schlüssel nicht gefunden')) { explanation = 'API-Schlüssel fehlt.'; recommendation = 'Prüfe .env Datei.'}
     else { explanation = 'Ein unerwarteter Fehler ist aufgetreten.'; recommendation = 'Bitte versuchen Sie es erneut oder überprüfen Sie die Browserkonsole auf Details.'; }
     return { explanation, recommendation };
  };

  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>
        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />
          {loading && <LoadingIndicator progress={progress} />}
          {typeof error === 'string' && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />
          {!loading && !error && companyInfo && ( <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} /> )}
          {!loading && !error && keyMetrics && (
            <IonList inset={true} style={{ marginTop: '20px', marginBottom: '20px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
              <IonItem lines="full"><IonLabel color="medium">Kennzahlen</IonLabel></IonItem>
              {keyMetrics.peRatio && <IonItem><IonLabel>KGV (P/E Ratio)</IonLabel><IonNote slot="end">{keyMetrics.peRatio}</IonNote></IonItem>}
              {keyMetrics.psRatio && <IonItem><IonLabel>KUV (P/S Ratio)</IonLabel><IonNote slot="end">{keyMetrics.psRatio}</IonNote></IonItem>}
              {keyMetrics.pbRatio && <IonItem><IonLabel>KBV (P/B Ratio)</IonLabel><IonNote slot="end">{keyMetrics.pbRatio}</IonNote></IonItem>}
              {keyMetrics.evToEbitda && <IonItem><IonLabel>EV/EBITDA</IonLabel><IonNote slot="end">{keyMetrics.evToEbitda}</IonNote></IonItem>}
              {keyMetrics.grossMargin && <IonItem><IonLabel>Bruttomarge</IonLabel><IonNote slot="end">{keyMetrics.grossMargin}</IonNote></IonItem>}
              {keyMetrics.operatingMargin && <IonItem><IonLabel>Operative Marge</IonLabel><IonNote slot="end">{keyMetrics.operatingMargin}</IonNote></IonItem>}
              {keyMetrics.dividendYield && <IonItem lines="none"><IonLabel>Dividendenrendite</IonLabel><IonNote slot="end">{keyMetrics.dividendYield}</IonNote></IonItem>}
            </IonList>
           )}
          {!loading && !error && currentTicker && (
            <IonGrid>
               <IonRow>
                 <IonCol size="12" size-md="4"> {mainChartData.labels.length > 0 ? (<div className="chart-container" onClick={() => openModal('revenue')}><BarChart data={mainChartData} title="Revenue (Annual)" /></div>) : (<p>Keine Umsatzdaten.</p>)} </IonCol>
                 <IonCol size="12" size-md="4"> {mainEPSData.labels.length > 0 ? (<div className="chart-container" onClick={() => openModal('eps')}><BarChart data={mainEPSData} title="EPS (Annual)" /></div>) : (<p>Keine EPS-Daten.</p>)} </IonCol>
                 <IonCol size="12" size-md="4"> {mainFCFData.labels.length > 0 ? (<div className="chart-container" onClick={() => openModal('fcf')}><BarChart data={mainFCFData} title="FCF (Annual)" /></div>) : (<p>Keine FCF-Daten.</p>)} </IonCol>
              </IonRow>
            </IonGrid>
           )}
          <ChartModal isOpen={charts.revenue.isModalOpen} onClose={() => closeModal('revenue')} title="Revenue" annualData={annualData} quarterlyData={quarterlyData} isAnnualView={charts.revenue.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('revenue', isAnnual)} years={charts.revenue.years} setYears={(y) => handleYearsChange('revenue', y)} />
          <ChartModal isOpen={charts.eps.isModalOpen} onClose={() => closeModal('eps')} title="EPS" annualData={annualEPS} quarterlyData={quarterlyEPS} isAnnualView={charts.eps.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('eps', isAnnual)} years={charts.eps.years} setYears={(y) => handleYearsChange('eps', y)} />
          <ChartModal isOpen={charts.fcf.isModalOpen} onClose={() => closeModal('fcf')} title="FCF" annualData={annualFCF} quarterlyData={quarterlyFCF} isAnnualView={charts.fcf.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('fcf', isAnnual)} years={charts.fcf.years} setYears={(y) => handleYearsChange('fcf', y)} />
        </div>
      </IonContent>
    </IonPage>
  );
};
export default Home;