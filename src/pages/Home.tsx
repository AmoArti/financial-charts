import React, { useState, useEffect, useCallback } from 'react'; // useCallback wieder entfernt, wenn nicht nötig
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonToast, IonList, IonItem, IonLabel, IonNote } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import ChartModal from '../components/ChartModal';
import CompanyInfoCard from '../components/CompanyInfoCard';
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
// Passe den Pfad und Import an
import { useStockData, StockData, CompanyInfo, KeyMetrics } from '../hooks/useStockData';
import './Home.css';

// Die ChartState enthält wieder das 'data'-Feld (Originalversion)
interface ChartState {
  isModalOpen: boolean;
  isAnnualView: boolean;
  years: number;
  data: StockData;
}

const Home: React.FC = () => {
  // Hol die Daten vom Hook (inkl. keyMetrics)
  const { annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, keyMetrics, fetchData } = useStockData();

  // State für die individuellen Chart-Einstellungen (Originalversion)
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

  // Hauptdaten für Charts
  const mainChartData = annualData;
  const mainEPSData = annualEPS;
  const mainFCFData = annualFCF;

  // --- useEffect Hooks (Originalversion) ---
  useEffect(() => { document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard"; }, [currentTicker]);

  // Update des 'data'-Feldes im 'charts'-State (Originalversion)
  useEffect(() => {
    setCharts(prev => ({
      ...prev,
      revenue: { ...prev.revenue, data: prev.revenue.isAnnualView ? annualData : quarterlyData },
      eps: { ...prev.eps, data: prev.eps.isAnnualView ? annualEPS : quarterlyEPS },
      fcf: { ...prev.fcf, data: prev.fcf.isAnnualView ? annualFCF : quarterlyFCF },
    }));
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF]);

  // Erfolgsmeldung
  useEffect(() => { if (!loading && !error && progress === 100 && currentTicker && (mainChartData.labels.length > 0 || mainEPSData.labels.length > 0 || mainFCFData.labels.length > 0)) { setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`); } }, [loading, error, progress, mainChartData, mainEPSData, mainFCFData, currentTicker]);

  // Originale drei useEffects für Jahresänderungen
  // fetchData als Abhängigkeit hinzugefügt
  useEffect(() => { if (currentTicker) fetchData(currentTicker, charts.revenue.years); }, [charts.revenue.years, currentTicker, fetchData]);
  useEffect(() => { if (currentTicker) fetchData(currentTicker, charts.eps.years); }, [charts.eps.years, currentTicker, fetchData]);
  useEffect(() => { if (currentTicker) fetchData(currentTicker, charts.fcf.years); }, [charts.fcf.years, currentTicker, fetchData]);

  // --- Event Handlers (Originalversion) ---
  const handleSearch = (query: string) => {
    const upperCaseQuery = query.toUpperCase();
    setCurrentTicker(upperCaseQuery);
    setSuccessMessage('');
    const initialYears = 10;
     setCharts(prev => ({ // Setzt Jahre für alle Charts, triggert useEffects
       revenue: { ...prev.revenue, years: initialYears, isModalOpen: false, isAnnualView: true },
       eps: { ...prev.eps, years: initialYears, isModalOpen: false, isAnnualView: true },
       fcf: { ...prev.fcf, years: initialYears, isModalOpen: false, isAnnualView: true },
     }));
  };

  const handleRetry = () => { if (currentTicker) { fetchData(currentTicker, charts.revenue.years); } };

  const openModal = (chartType: 'revenue' | 'eps' | 'fcf') => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: true }, })); };
  const closeModal = (chartType: 'revenue' | 'eps' | 'fcf') => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: false }, })); };

  // handleViewToggle (Originalversion mit data update)
  const handleViewToggle = (chartType: 'revenue' | 'eps' | 'fcf', isAnnual: boolean) => {
    setCharts(prev => {
        const sourceData = chartType === 'revenue' ? (isAnnual ? annualData : quarterlyData) :
                           chartType === 'eps' ? (isAnnual ? annualEPS : quarterlyEPS) :
                           (isAnnual ? annualFCF : quarterlyFCF);
        return { ...prev, [chartType]: { ...prev[chartType], isAnnualView: isAnnual, data: sourceData, }, }
    });
  };

  // handleYearsChange (Originalversion, triggert useEffect)
  const handleYearsChange = (chartType: 'revenue' | 'eps' | 'fcf', years: number) => {
    setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], years }, }));
  };

  // --- Helper Functions (unverändert) ---
  const formatMarketCap = (marketCap: string) => { const num = parseFloat(marketCap); if(isNaN(num)) return 'N/A'; return (num / 1e9).toFixed(2) + ' Mrd. $'; };
  const getErrorDetails = (errorMessage: string) => {
     let explanation = ''; let recommendation = '';
     if (errorMessage.includes('Ungültiger Ticker')) { explanation = 'Ticker nicht korrekt.'; recommendation = 'Prüfen Sie den Ticker.'; }
     else if (errorMessage.includes('API-Limit erreicht')) { explanation = 'API-Limit erreicht.'; recommendation = 'Warte eine Minute.'; }
     else if (errorMessage.includes('Keine ') && errorMessage.includes('Daten')) { explanation = `Für ${currentTicker} sind diese Daten nicht verfügbar.`; recommendation = 'Anderen Ticker versuchen.';}
     else if (errorMessage.includes('API-Schlüssel nicht gefunden')) { explanation = 'API-Schlüssel fehlt.'; recommendation = 'Prüfe .env Datei.'}
     else { // Default Fall
         explanation = 'Ein unerwarteter Fehler ist aufgetreten.';
         recommendation = 'Bitte versuchen Sie es erneut oder überprüfen Sie die Browserkonsole auf Details.';
     }
     return { explanation, recommendation };
  };

  // --- JSX Rendering ---
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>

        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />
          {loading && <LoadingIndicator progress={progress} />}
          {typeof error === 'string' && !loading && (
            <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} />
          )}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {/* CompanyInfoCard */}
          {!loading && !error && companyInfo && (
             <CompanyInfoCard
               companyInfo={companyInfo}
               ticker={currentTicker}
               formatMarketCap={formatMarketCap}
               keyMetrics={keyMetrics}
             />
           )}

          {/* Key Metrics Anzeige */}
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

          {/* Charts Grid */}
          {!loading && !error && currentTicker && (
            <IonGrid>
              <IonRow>
                 <IonCol size="12" size-md="4"> {mainChartData.labels.length > 0 ? (<div className="chart-container" onClick={() => openModal('revenue')}><BarChart data={mainChartData} title="Revenue (Annual)" /></div>) : (<p>Keine Umsatzdaten.</p>)} </IonCol>
                 <IonCol size="12" size-md="4"> {mainEPSData.labels.length > 0 ? (<div className="chart-container" onClick={() => openModal('eps')}><BarChart data={mainEPSData} title="EPS (Annual)" /></div>) : (<p>Keine EPS-Daten.</p>)} </IonCol>
                 <IonCol size="12" size-md="4"> {mainFCFData.labels.length > 0 ? (<div className="chart-container" onClick={() => openModal('fcf')}><BarChart data={mainFCFData} title="FCF (Annual)" /></div>) : (<p>Keine FCF-Daten.</p>)} </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {/* Modals */}
          <ChartModal isOpen={charts.revenue.isModalOpen} onClose={() => closeModal('revenue')} title="Revenue" annualData={annualData} quarterlyData={quarterlyData} isAnnualView={charts.revenue.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('revenue', isAnnual)} years={charts.revenue.years} setYears={(years) => handleYearsChange('revenue', years)} />
          <ChartModal isOpen={charts.eps.isModalOpen} onClose={() => closeModal('eps')} title="EPS" annualData={annualEPS} quarterlyData={quarterlyEPS} isAnnualView={charts.eps.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('eps', isAnnual)} years={charts.eps.years} setYears={(years) => handleYearsChange('eps', years)} />
          <ChartModal isOpen={charts.fcf.isModalOpen} onClose={() => closeModal('fcf')} title="FCF" annualData={annualFCF} quarterlyData={quarterlyFCF} isAnnualView={charts.fcf.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('fcf', isAnnual)} years={charts.fcf.years} setYears={(years) => handleYearsChange('fcf', years)} />

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;