import React, { useState, useEffect, useCallback } from 'react'; // useCallback hinzugefügt
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
  years: number; // Behält die vom Benutzer gewünschte Anzeigejahreszahl
  // data wird nicht mehr hier gespeichert, kommt direkt aus dem Hook
}

const Home: React.FC = () => {
  // fetchData aus dem Hook holen, useCallback sicherstellen, dass es stabil ist
  const { annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, fetchData } = useStockData();

  // State für die individuellen Chart-Einstellungen (Modal, Ansicht, gewünschte Jahre)
  const [charts, setCharts] = useState<{
    revenue: Omit<ChartState, 'data'>; // data entfernt
    eps: Omit<ChartState, 'data'>;
    fcf: Omit<ChartState, 'data'>;
  }>({
    revenue: { isModalOpen: false, isAnnualView: true, years: 10 },
    eps: { isModalOpen: false, isAnnualView: true, years: 10 },
    fcf: { isModalOpen: false, isAnnualView: true, years: 10 },
  });

  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  // Neuer State, um die maximal abgerufene Jahresanzahl für den aktuellen Ticker zu speichern
  const [maxYearsFetched, setMaxYearsFetched] = useState<number>(0);

  // Hauptdaten kommen direkt aus dem Hook
  const mainChartData = annualData;
  const mainEPSData = annualEPS;
  const mainFCFData = annualFCF;

  // --- useEffect Hooks ---

  // Titel aktualisieren
  useEffect(() => {
    document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  // Erfolgsmeldung anzeigen
  useEffect(() => {
    if (!loading && !error && progress === 100 && currentTicker && (mainChartData.labels.length > 0 || mainEPSData.labels.length > 0 || mainFCFData.labels.length > 0)) {
      // Nur anzeigen, wenn Ticker gesetzt ist und Daten geladen wurden
      setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
    }
  }, [loading, error, progress, mainChartData, mainEPSData, mainFCFData, currentTicker]);

  // Daten abrufen, wenn sich der Ticker ändert
  // Dieser Hook ersetzt die drei vorherigen Hooks, die von `charts.xxx.years` abhingen
  const stableFetchData = useCallback(fetchData, []); // fetchData stabilisieren, falls es sich im Hook ändern könnte
  useEffect(() => {
    if (currentTicker) {
      const initialFetchYears = 10; // Standardmäßig 10 Jahre laden (oder 20 für Max)
      console.log(`Workspaceing initial data for ${currentTicker} for ${initialFetchYears} years.`);
      stableFetchData(currentTicker, initialFetchYears);
      setMaxYearsFetched(initialFetchYears); // Setze die initial geladene Jahresanzahl
      setSuccessMessage(''); // Erfolgsmeldung zurücksetzen
      // Reset individual chart years to default on new search? Optional.
      // setCharts(prev => ({
      //   revenue: { ...prev.revenue, years: initialFetchYears },
      //   eps: { ...prev.eps, years: initialFetchYears },
      //   fcf: { ...prev.fcf, years: initialFetchYears },
      // }));
    } else {
      // Optional: Zustand zurücksetzen, wenn kein Ticker vorhanden ist
      setMaxYearsFetched(0);
      // Evtl. auch Chart-Daten etc. leeren, falls gewünscht
    }
  }, [currentTicker, stableFetchData]); // Hängt nur noch vom Ticker (und fetchData selbst) ab

  // --- Event Handlers ---

  const handleSearch = (query: string) => {
    // Setzt nur noch den Ticker. Der useEffect oben löst den Datenabruf aus.
    setCurrentTicker(query.toUpperCase());
  };

  const handleRetry = () => {
    if (currentTicker) {
      // Ruft Daten erneut ab, mit der maximal bisher versuchten Jahresanzahl
      const yearsToRetry = maxYearsFetched > 0 ? maxYearsFetched : 10;
      console.log(`Retrying fetch for ${currentTicker} for ${yearsToRetry} years.`);
      fetchData(currentTicker, yearsToRetry); // Hier direkt fetchData verwenden
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

  // Aktualisiert nur noch die Ansicht (Annual/Quarterly) im State
  const handleViewToggle = (chartType: 'revenue' | 'eps' | 'fcf', isAnnual: boolean) => {
    setCharts(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        isAnnualView: isAnnual,
      },
    }));
  };

  // Wird aufgerufen, wenn der Benutzer die Jahre im Modal ändert
  const handleYearsChange = (chartType: 'revenue' | 'eps' | 'fcf', years: number) => {
    // 1. Aktualisiere den Zustand für das spezifische Chart (gewünschte Anzeigejahre)
    setCharts(prev => ({
      ...prev,
      [chartType]: { ...prev[chartType], years },
    }));

    // 2. Prüfe, ob mehr Daten abgerufen werden müssen
    if (currentTicker && years > maxYearsFetched) {
      console.log(`Workspaceing additional data for ${currentTicker} for ${years} years (previously fetched ${maxYearsFetched}).`);
      fetchData(currentTicker, years); // Hier direkt fetchData verwenden
      setMaxYearsFetched(years); // Aktualisiere die max. geladene Jahresanzahl
    } else {
      console.log(`No new fetch needed for ${years} years (already fetched ${maxYearsFetched}).`);
    }
  };

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string) => {
    const marketCapNumber = parseFloat(marketCap);
    if (isNaN(marketCapNumber)) return 'N/A';
    return (marketCapNumber / 1e9).toFixed(2) + ' Mrd. $';
  };

  const getErrorDetails = (errorMessage: string) => {
    let explanation = '';
    let recommendation = '';
    // ... (Logik von getErrorDetails bleibt unverändert) ...
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

  // --- JSX Rendering ---
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

          {/* Ladeanzeige */}
          {loading && <LoadingIndicator progress={progress} />}

          {/* Fehleranzeige */}
          {error && !loading && ( // Zeige Fehler nur wenn nicht gerade geladen wird
            <ErrorCard
              error={error}
              getErrorDetails={getErrorDetails}
              onRetry={handleRetry}
            />
          )}

          {/* Erfolgsmeldung */}
          <IonToast
            isOpen={!!successMessage}
            message={successMessage}
            duration={3000}
            color="success"
            position="top"
            onDidDismiss={() => setSuccessMessage('')}
          />

          {/* Unternehmensinfos (nur wenn nicht geladen wird und kein Fehler vorliegt) */}
          {!loading && !error && companyInfo && (
             <CompanyInfoCard
               companyInfo={companyInfo}
               ticker={currentTicker}
               formatMarketCap={formatMarketCap}
             />
           )}


          {/* Charts (nur wenn nicht geladen wird und kein Fehler vorliegt) */}
          {!loading && !error && currentTicker && (
            <IonGrid>
              <IonRow>
                <IonCol size="12" size-md="4">
                  {mainChartData.labels.length > 0 ? (
                    <div className="chart-container" onClick={() => openModal('revenue')}>
                      <BarChart data={mainChartData} title="Revenue (Annual)" />
                    </div>
                  ) : (
                     // Zeige nur Text, wenn Ticker gesetzt ist, aber keine Daten kamen
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
          )}

          {/* Modals (immer rendern, aber Sichtbarkeit über isOpen steuern) */}
          <ChartModal
            isOpen={charts.revenue.isModalOpen}
            onClose={() => closeModal('revenue')}
            title="Revenue"
            // Daten direkt aus dem Hook übergeben
            annualData={annualData}
            quarterlyData={quarterlyData}
            isAnnualView={charts.revenue.isAnnualView}
            setIsAnnualView={(isAnnual) => handleViewToggle('revenue', isAnnual)}
            years={charts.revenue.years} // Gewünschte Anzeigejahre
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