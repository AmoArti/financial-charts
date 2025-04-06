import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonToast } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import ChartModal from '../components/ChartModal';
import CompanyInfoCard from '../components/CompanyInfoCard';
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
// Annahme: StockData Typ ist korrekt importiert
import { useStockData, StockData } from '../hooks/useStockData';
import './Home.css';

// Die ChartState enthält wieder das 'data'-Feld
interface ChartState {
  isModalOpen: boolean;
  isAnnualView: boolean;
  years: number;
  data: StockData; // Daten werden wieder hier gehalten für Modal-Logik
}

const Home: React.FC = () => {
  // Dein funktionierender Hook
  const { annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, fetchData } = useStockData();

  // Initialisiere den State wieder mit leeren 'data'-Feldern
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

  // Hauptdaten für die Übersicht (kommen direkt vom Hook)
  const mainChartData = annualData;
  const mainEPSData = annualEPS;
  const mainFCFData = annualFCF;

  // --- useEffect Hooks ---

  // Titel aktualisieren
  useEffect(() => {
    document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  // Update des 'data'-Feldes im 'charts'-State, wenn sich die Daten vom Hook ändern
  useEffect(() => {
    setCharts(prev => ({
      ...prev,
      revenue: { ...prev.revenue, data: prev.revenue.isAnnualView ? annualData : quarterlyData },
      eps: { ...prev.eps, data: prev.eps.isAnnualView ? annualEPS : quarterlyEPS },
      fcf: { ...prev.fcf, data: prev.fcf.isAnnualView ? annualFCF : quarterlyFCF },
    }));
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF]);

  // Erfolgsmeldung anzeigen
  useEffect(() => {
    // Bedingung leicht angepasst, um sicherzustellen, dass Ticker gesetzt ist
    if (!loading && !error && progress === 100 && currentTicker && (mainChartData.labels.length > 0 || mainEPSData.labels.length > 0 || mainFCFData.labels.length > 0)) {
      setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
    }
  }, [loading, error, progress, mainChartData, mainEPSData, mainFCFData, currentTicker]);

  // *** Die ursprünglichen drei useEffects, die auf Jahresänderungen reagieren ***
  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker, charts.revenue.years);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charts.revenue.years, currentTicker]); // fetchData hier nicht in Deps, um Loops zu vermeiden (altes Muster)

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker, charts.eps.years);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charts.eps.years, currentTicker]);

  useEffect(() => {
    if (currentTicker) {
      fetchData(currentTicker, charts.fcf.years);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charts.fcf.years, currentTicker]);
  // ***************************************************************************

  // --- Event Handlers ---

  // handleSearch ruft fetchData wieder direkt auf
  const handleSearch = (query: string) => {
    const upperCaseQuery = query.toUpperCase();
    setCurrentTicker(upperCaseQuery);
    setSuccessMessage('');
    // Setze Jahre zurück und löse initialen Fetch aus (z.B. mit 10 Jahren)
    const initialYears = 10;
     setCharts(prev => ({
       revenue: { ...prev.revenue, years: initialYears },
       eps: { ...prev.eps, years: initialYears },
       fcf: { ...prev.fcf, years: initialYears },
     }));
    // Der Fetch wird durch die useEffects oben ausgelöst, wenn sich years/ticker ändern
    // Alternativ: Direkter Fetch hier, aber dann muss man die useEffects anpassen/entfernen
    // fetchData(upperCaseQuery, initialYears); // Direkter Fetch hier würde auch gehen
  };

  // handleRetry ruft fetchData mit den Jahren des Revenue-Charts auf (oder einem Default)
  const handleRetry = () => {
    if (currentTicker) {
      fetchData(currentTicker, charts.revenue.years); // Oder z.B. immer 10?
    }
  };

  const openModal = (chartType: 'revenue' | 'eps' | 'fcf') => { /* ... unverändert ... */
    setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: true }, }));
   };
  const closeModal = (chartType: 'revenue' | 'eps' | 'fcf') => { /* ... unverändert ... */
    setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: false }, }));
   };

  // handleViewToggle aktualisiert jetzt auch wieder das 'data'-Feld im State
  const handleViewToggle = (chartType: 'revenue' | 'eps' | 'fcf', isAnnual: boolean) => {
    setCharts(prev => {
        const sourceData = chartType === 'revenue' ? (isAnnual ? annualData : quarterlyData) :
                           chartType === 'eps' ? (isAnnual ? annualEPS : quarterlyEPS) :
                           (isAnnual ? annualFCF : quarterlyFCF);
        return {
          ...prev,
          [chartType]: {
            ...prev[chartType],
            isAnnualView: isAnnual,
            data: sourceData, // Daten direkt setzen
          },
        }
    });
  };

  // handleYearsChange aktualisiert nur die Jahre, der useEffect löst den Fetch aus
  const handleYearsChange = (chartType: 'revenue' | 'eps' | 'fcf', years: number) => {
    setCharts(prev => ({
      ...prev,
      [chartType]: { ...prev[chartType], years },
    }));
    // Kein direkter Fetch hier, der entsprechende useEffect wird getriggert
  };

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string) => { /* ... unverändert ... */
    const num = parseFloat(marketCap); if(isNaN(num)) return 'N/A'; return (num / 1e9).toFixed(2) + ' Mrd. $';
   };
  const getErrorDetails = (errorMessage: string) => { /* ... unverändert ... */
    let explanation = '', recommendation = '';
    if (errorMessage.includes('Ungültiger Ticker')) { explanation = 'Ticker nicht korrekt.'; recommendation = 'Prüfen Sie den Ticker.'; }
    else if (errorMessage.includes('API-Limit erreicht')) { explanation = 'API-Limit erreicht.'; recommendation = 'Warte eine Minute.'; }
    else if (errorMessage.includes('Keine ') && errorMessage.includes('Daten')) { explanation = `Für ${currentTicker} sind diese Daten nicht verfügbar.`; recommendation = 'Anderen Ticker versuchen.';}
    else if (errorMessage.includes('API-Schlüssel nicht gefunden')) { explanation = 'API-Schlüssel fehlt.'; recommendation = 'Prüfe .env Datei.'}
    else { explanation = 'Unerwarteter Fehler.'; recommendation = 'Erneut versuchen.'; }
    return { explanation, recommendation };
   };

  // --- JSX Rendering ---
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar>
        </IonHeader>

        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {loading && <LoadingIndicator progress={progress} />}

          {error && !loading && (
            <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} />
          )}

          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {!loading && !error && companyInfo && (
             <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} />
          )}

          {/* Charts Grid */}
          {!loading && !error && currentTicker && (
            <IonGrid>
              <IonRow>
                {/* Revenue Chart Col */}
                <IonCol size="12" size-md="4">
                  {mainChartData.labels.length > 0 ? (
                    <div className="chart-container" onClick={() => openModal('revenue')}>
                      <BarChart data={mainChartData} title="Revenue (Annual)" />
                    </div>
                  ) : (<p>Keine Umsatzdaten verfügbar.</p>)}
                </IonCol>
                {/* EPS Chart Col */}
                <IonCol size="12" size-md="4">
                  {mainEPSData.labels.length > 0 ? (
                    <div className="chart-container" onClick={() => openModal('eps')}>
                      <BarChart data={mainEPSData} title="EPS (Annual)" />
                    </div>
                  ) : (<p>Keine EPS-Daten verfügbar.</p>)}
                </IonCol>
                 {/* FCF Chart Col */}
                <IonCol size="12" size-md="4">
                  {mainFCFData.labels.length > 0 ? (
                    <div className="chart-container" onClick={() => openModal('fcf')}>
                      <BarChart data={mainFCFData} title="FCF (Annual)" />
                    </div>
                  ) : (<p>Keine FCF-Daten verfügbar.</p>)}
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {/* Modals */}
          {/* Übergeben jetzt wieder das 'data'-Feld aus dem lokalen 'charts'-State */}
          <ChartModal
            isOpen={charts.revenue.isModalOpen}
            onClose={() => closeModal('revenue')}
            title="Revenue"
            annualData={annualData} // Könnte auch charts.revenue.data übergeben, aber direkter Hook-State ist ok
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