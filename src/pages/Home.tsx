// src/pages/Home.tsx (Mit korrigiertem console.log und angepasster Kennzahlen-Anzeige)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonToast, IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import ChartModal from '../components/ChartModal';
import CompanyInfoCard from '../components/CompanyInfoCard';
import ErrorCard from '../components/ErrorCard';
import LoadingIndicator from '../components/LoadingIndicator';
// Hole auch die neuen Typen und Daten aus dem Hook
import { useStockData, StockData, CompanyInfo, KeyMetrics, MultiDatasetStockData } from '../hooks/useStockData';
import './Home.css';

interface ChartState {
  isModalOpen: boolean;
  isAnnualView: boolean;
  years: number;
}

const Home: React.FC = () => {
  // --- Hooks und State Deklarationen ---
  const {
    annualData, quarterlyData, // Original Revenue (wird evtl. nicht mehr direkt genutzt)
    annualEPS, quarterlyEPS,
    annualFCF, quarterlyFCF,
    annualIncomeStatement, quarterlyIncomeStatement, // NEU
    loading, error, progress, companyInfo, keyMetrics, fetchData
  } = useStockData();

  const [charts, setCharts] = useState<{
    revenue: ChartState; // Steuert das Income Statement Modal
    eps: ChartState;
    fcf: ChartState;
  }>({
    revenue: { isModalOpen: false, isAnnualView: true, years: 10 },
    eps: { isModalOpen: false, isAnnualView: true, years: 10 },
    fcf: { isModalOpen: false, isAnnualView: true, years: 10 },
  });
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [maxYearsFetched, setMaxYearsFetched] = useState<number>(0);
  const [isFetchingMoreYears, setIsFetchingMoreYears] = useState<boolean>(false);
  const prevLoadingRef = useRef<boolean>(loading);

  // --- Daten für Hauptansicht ---
  // (Übergabe an BarChart im MultiDataset-Format)
   const mainChartDataAnnualRevenue: MultiDatasetStockData = {
       labels: annualIncomeStatement?.labels || [],
       datasets: annualIncomeStatement?.datasets?.filter(ds => ds.label === 'Revenue') || []
   };
   const mainEPSDataAnnual: MultiDatasetStockData = { labels: annualEPS.labels || [], datasets: [{ label: 'EPS', values: annualEPS.values || [] }] };
   const mainFCFDataAnnual: MultiDatasetStockData = { labels: annualFCF.labels || [], datasets: [{ label: 'FCF', values: annualFCF.values || [] }] };

  // --- useEffect Hooks ---
  useEffect(() => { document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard"; }, [currentTicker]);

  // Angepasster useEffect für Erfolgsmeldung
  useEffect(() => {
      if (prevLoadingRef.current && !loading && !error && currentTicker) {
           const hasMainData = mainChartDataAnnualRevenue.labels.length > 0 || mainEPSDataAnnual.labels.length > 0 || mainFCFDataAnnual.labels.length > 0;
           if(hasMainData) {
               setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
           }
      }
  }, [loading, error, currentTicker, mainChartDataAnnualRevenue, mainEPSDataAnnual, mainFCFDataAnnual]);

  // Effekt zum Aktualisieren des Refs *nach* dem Rendern
  useEffect(() => {
    prevLoadingRef.current = loading;
  });

  // Effekt zum Abrufen der initialen Daten bei Ticker-Änderung
  useEffect(() => {
    if (currentTicker) {
      const initialFetchYears = 10;
      console.log(`[Home useEffect - Ticker Change] Fetching initial data for ${currentTicker}`);
      fetchData(currentTicker, initialFetchYears);
      setMaxYearsFetched(initialFetchYears);
      setSuccessMessage(''); // Alte Meldung löschen bei neuer Suche
       setCharts(prev => ({
           revenue: { ...prev.revenue, years: initialFetchYears, isModalOpen: false }, // Modal schließen
           eps: { ...prev.eps, years: initialFetchYears, isModalOpen: false }, // Modal schließen
           fcf: { ...prev.fcf, years: initialFetchYears, isModalOpen: false }, // Modal schließen
       }));
       setIsFetchingMoreYears(false); // Sicherstellen, dass Flag zurückgesetzt wird
    } else {
      // Reset wenn kein Ticker (z.B. beim Start oder Löschen)
      setMaxYearsFetched(0);
      setIsFetchingMoreYears(false);
      // TODO: Optional hier auch alle Daten-States (companyInfo, keyMetrics, etc.) zurücksetzen?
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicker]); // Nur von currentTicker abhängig

  // useEffect zum Zurücksetzen von isFetchingMoreYears, wenn Laden endet
  useEffect(() => {
     if (!loading && isFetchingMoreYears) {
         setIsFetchingMoreYears(false);
         console.log("[Home useEffect - Loading End] Resetting isFetchingMoreYears flag.");
     }
  }, [loading, isFetchingMoreYears]);

  // --- Event Handlers ---
  const handleSearch = (query: string) => { setCurrentTicker(query.toUpperCase()); };
  const handleRetry = () => {
    if (currentTicker) {
        console.log(`[Home handleRetry] Retrying fetch for ${currentTicker}`);
        const yearsToRetry = maxYearsFetched > 0 ? maxYearsFetched : 10;
        fetchData(currentTicker, yearsToRetry);
    }
   };
  const openModal = (chartType: 'revenue' | 'eps' | 'fcf') => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: true }, })); };
  const closeModal = (chartType: 'revenue' | 'eps' | 'fcf') => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isModalOpen: false }, })); };
  const handleViewToggle = (chartType: 'revenue' | 'eps' | 'fcf', isAnnual: boolean) => { setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], isAnnualView: isAnnual, }, })); };

  const handleYearsChange = (chartType: 'revenue' | 'eps' | 'fcf', years: number) => {
    setCharts(prev => ({ ...prev, [chartType]: { ...prev[chartType], years }, }));
    if (currentTicker && years > maxYearsFetched) {
      console.log(`[Home handleYearsChange] Fetching additional data for ${currentTicker} (${years} years, max was ${maxYearsFetched}).`);
      setIsFetchingMoreYears(true);
      setMaxYearsFetched(years);
      fetchData(currentTicker, years);
    } else {
       if (isFetchingMoreYears) setIsFetchingMoreYears(false);
    }
  };

  // --- Helper Functions ---
  const formatMarketCap = (marketCap: string | null | undefined): string => {
     if (!marketCap) return 'N/A';
     const num = parseFloat(marketCap);
     if(isNaN(num)) return 'N/A';
     return (num / 1e9).toFixed(2) + ' Mrd. $';
  };

  const getErrorDetails = (errorMessage: string): { explanation: string; recommendation: string } => {
      let explanation = ''; let recommendation = '';
      if (!errorMessage) errorMessage = "Unbekannter Fehler";
      if (errorMessage.includes('API-Fehler bei') || errorMessage.includes('Ungültiger Ticker')) { explanation = 'Der eingegebene Ticker wurde nicht gefunden oder ist ungültig.'; recommendation = 'Bitte überprüfen Sie die Schreibweise (z.B. AAPL für Apple).'; }
      else if (errorMessage.includes('API-Limit erreicht')) { explanation = 'Das Abfragelimit für die API wurde erreicht (Alpha Vantage Free Tier).'; recommendation = 'Bitte warten Sie eine Minute und versuchen Sie es erneut.'; }
      else if (errorMessage.includes('Keine Finanzdaten') || errorMessage.includes('Keine Unternehmensinformationen') || errorMessage.includes('Kein aktueller Aktienkurs')) { explanation = `Für den Ticker "${currentTicker || ''}" konnten notwendige Daten nicht gefunden werden.`; recommendation = 'Möglicherweise werden für diesen Ticker nicht alle Daten von Alpha Vantage bereitgestellt.'; }
      else if (errorMessage.includes('API-Schlüssel nicht gefunden')) { explanation = 'Der API-Schlüssel für Alpha Vantage fehlt.'; recommendation = 'Bitte überprüfen Sie die Konfiguration (z.B. .env Datei).'}
      else { explanation = `Ein unerwarteter Fehler ist aufgetreten: ${errorMessage}`; recommendation = 'Bitte versuchen Sie es erneut. Bei anhaltenden Problemen prüfen Sie die Browserkonsole.'; }
      return { explanation, recommendation };
  };

  // *** console.log VOR dem return ***
  console.log('DEBUG: Home Component Render - KeyMetrics State:', keyMetrics);

  // --- JSX Return ---
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Stock Dashboard</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Stock Dashboard</IonTitle></IonToolbar></IonHeader>
        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {/* Zeige globalen Ladebalken nur beim ALLERERSTEN Laden */}
          {loading && !isFetchingMoreYears && !companyInfo && <LoadingIndicator progress={progress} />}

          {/* Zeige Fehler nur wenn nicht geladen wird */}
          {typeof error === 'string' && !loading && ( <ErrorCard error={error} getErrorDetails={getErrorDetails} onRetry={handleRetry} /> )}

          {/* Erfolgsmeldung */}
          <IonToast isOpen={!!successMessage} message={successMessage} duration={3000} color="success" position="top" onDidDismiss={() => setSuccessMessage('')} />

          {/* Zeige Company Info Card, wenn Daten vorhanden sind */}
           {companyInfo && ( <CompanyInfoCard companyInfo={companyInfo} ticker={currentTicker} formatMarketCap={formatMarketCap} keyMetrics={keyMetrics} /> )}

           {/* Kennzahlenliste anzeigen, wenn keyMetrics vorhanden sind (mit N/A Fallback) */}
           {keyMetrics && (
             <IonList inset={true} style={{ marginTop: '20px', marginBottom: '20px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
               <IonItem lines="full"><IonLabel color="medium">Kennzahlen</IonLabel></IonItem>
               {/* Zeige 'N/A' wenn Wert null ist, ansonsten den Wert */}
               <IonItem><IonLabel>KGV (P/E Ratio)</IonLabel><IonNote slot="end">{keyMetrics.peRatio ?? 'N/A'}</IonNote></IonItem>
               <IonItem><IonLabel>KUV (P/S Ratio)</IonLabel><IonNote slot="end">{keyMetrics.psRatio ?? 'N/A'}</IonNote></IonItem>
               <IonItem><IonLabel>KBV (P/B Ratio)</IonLabel><IonNote slot="end">{keyMetrics.pbRatio ?? 'N/A'}</IonNote></IonItem>
               <IonItem><IonLabel>EV/EBITDA</IonLabel><IonNote slot="end">{keyMetrics.evToEbitda ?? 'N/A'}</IonNote></IonItem>
               <IonItem><IonLabel>Bruttomarge</IonLabel><IonNote slot="end">{keyMetrics.grossMargin ?? 'N/A'}</IonNote></IonItem>
               <IonItem><IonLabel>Operative Marge</IonLabel><IonNote slot="end">{keyMetrics.operatingMargin ?? 'N/A'}</IonNote></IonItem>
               <IonItem lines="none"><IonLabel>Dividendenrendite</IonLabel><IonNote slot="end">{keyMetrics.dividendYield ?? 'N/A'}</IonNote></IonItem>
             </IonList>
           )}

          {/* Haupt-Charts - Zeige Grid, wenn Ticker gesetzt und kein Fehler */}
          {!error && currentTicker && (
            <IonGrid>
               <IonRow>
                 {/* Revenue Chart/Placeholder */}
                 <IonCol size="12" size-md="4">
                     {mainChartDataAnnualRevenue.labels.length > 0 && mainChartDataAnnualRevenue.datasets.length > 0 ? (
                         <div className="chart-container" onClick={() => openModal('revenue')}>
                             <BarChart data={mainChartDataAnnualRevenue} title="Revenue (Annual)" />
                         </div>
                     ) : !loading && (<p>Keine Umsatzdaten verfügbar.</p>)}
                 </IonCol>

                 {/* EPS Chart/Placeholder */}
                 <IonCol size="12" size-md="4">
                     {mainEPSDataAnnual.labels.length > 0 && mainEPSDataAnnual.datasets[0].values.length > 0 ? (
                         <div className="chart-container" onClick={() => openModal('eps')}>
                             <BarChart data={mainEPSDataAnnual} title="EPS (Annual)" />
                          </div>
                     ) : !loading && (<p>Keine EPS-Daten verfügbar.</p>)}
                 </IonCol>

                 {/* FCF Chart/Placeholder */}
                 <IonCol size="12" size-md="4">
                     {mainFCFDataAnnual.labels.length > 0 && mainFCFDataAnnual.datasets[0].values.length > 0 ? (
                         <div className="chart-container" onClick={() => openModal('fcf')}>
                             <BarChart data={mainFCFDataAnnual} title="FCF (Annual)" />
                         </div>
                     ) : !loading && (<p>Keine FCF-Daten verfügbar.</p>)}
                  </IonCol>
               </IonRow>
             </IonGrid>
            )}

          {/* ---- Modals ---- */}
          {/* Stelle sicher, dass alle Modals die korrekten Props erhalten */}
          <ChartModal
            isOpen={charts.revenue.isModalOpen}
            onClose={() => closeModal('revenue')}
            title="Income Statement"
            annualData={annualIncomeStatement}
            quarterlyData={quarterlyIncomeStatement}
            isAnnualView={charts.revenue.isAnnualView}
            setIsAnnualView={(isAnnual) => handleViewToggle('revenue', isAnnual)}
            years={charts.revenue.years}
            setYears={(y) => handleYearsChange('revenue', y)}
            isFetchingMoreYears={isFetchingMoreYears}
          />
          <ChartModal
             isOpen={charts.eps.isModalOpen} onClose={() => closeModal('eps')} title="EPS"
             annualData={{ labels: annualEPS.labels || [], datasets: [{ label: 'EPS', values: annualEPS.values || [] }] }}
             quarterlyData={{ labels: quarterlyEPS.labels || [], datasets: [{ label: 'EPS', values: quarterlyEPS.values || [] }] }}
             isAnnualView={charts.eps.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('eps', isAnnual)}
             years={charts.eps.years} setYears={(y) => handleYearsChange('eps', y)}
             isFetchingMoreYears={isFetchingMoreYears}
           />
           <ChartModal
             isOpen={charts.fcf.isModalOpen} onClose={() => closeModal('fcf')} title="FCF"
             annualData={{ labels: annualFCF.labels || [], datasets: [{ label: 'FCF', values: annualFCF.values || [] }] }}
             quarterlyData={{ labels: quarterlyFCF.labels || [], datasets: [{ label: 'FCF', values: quarterlyFCF.values || [] }] }}
             isAnnualView={charts.fcf.isAnnualView} setIsAnnualView={(isAnnual) => handleViewToggle('fcf', isAnnual)}
             years={charts.fcf.years} setYears={(y) => handleYearsChange('fcf', y)}
             isFetchingMoreYears={isFetchingMoreYears}
            />

        </div>
      </IonContent>
    </IonPage>
  );
};
export default Home;