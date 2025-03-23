// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonModal, IonButton, IonIcon, IonToggle, IonLabel, IonSpinner, IonProgressBar, IonToast, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { closeOutline, refreshOutline } from 'ionicons/icons';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import { useStockData } from '../hooks/useStockData';
import './Home.css';

interface StockData {
  labels: (string | number)[];
  values: number[];
}

const Home: React.FC = () => {
  const { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, fetchData } = useStockData();
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isEPSModalOpen, setIsEPSModalOpen] = useState(false);
  const [isFCFModalOpen, setIsFCFModalOpen] = useState(false);
  const [isAnnualViewRevenue, setIsAnnualViewRevenue] = useState(true);
  const [isAnnualViewEPS, setIsAnnualViewEPS] = useState(true);
  const [isAnnualViewFCF, setIsAnnualViewFCF] = useState(true);
  const [currentChartDataRevenue, setCurrentChartDataRevenue] = useState<StockData>({ labels: [], values: [] });
  const [currentEPSDataEPS, setCurrentEPSDataEPS] = useState<StockData>({ labels: [], values: [] });
  const [currentFCFDataFCF, setCurrentFCFDataFCF] = useState<StockData>({ labels: [], values: [] });
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const revenueModal = useRef<HTMLIonModalElement>(null);
  const epsModal = useRef<HTMLIonModalElement>(null);
  const fcfModal = useRef<HTMLIonModalElement>(null);

  const mainChartData = annualData;
  const mainEPSData = annualEPS;
  const mainFCFData = annualFCF;

  // Dynamisch den Tab-Titel basierend auf dem Ticker setzen
  useEffect(() => {
    document.title = currentTicker ? `${currentTicker} - Stock Dashboard` : "Stock Dashboard";
  }, [currentTicker]);

  // Daten für die Modals aktualisieren
  useEffect(() => {
    setCurrentChartDataRevenue(isAnnualViewRevenue ? annualData : quarterlyData);
    setCurrentEPSDataEPS(isAnnualViewEPS ? annualEPS : quarterlyEPS);
    setCurrentFCFDataFCF(isAnnualViewFCF ? annualFCF : quarterlyFCF);
    console.log("Revenue Modal Data:", isAnnualViewRevenue ? annualData : quarterlyData);
    console.log("EPS Modal Data:", isAnnualViewEPS ? annualEPS : quarterlyEPS);
    console.log("FCF Modal Data:", isAnnualViewFCF ? annualFCF : quarterlyFCF);
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, isAnnualViewRevenue, isAnnualViewEPS, isAnnualViewFCF]);

  // Erfolgsmeldung anzeigen, wenn Daten geladen wurden
  useEffect(() => {
    if (!loading && !error && progress === 100 && (mainChartData.labels.length > 0 || mainEPSData.labels.length > 0 || mainFCFData.labels.length > 0)) {
      setSuccessMessage(`Daten für ${currentTicker} erfolgreich geladen`);
    }
  }, [loading, error, progress, mainChartData, mainEPSData, mainFCFData, currentTicker]);

  const handleSearch = (query: string) => {
    setCurrentTicker(query.toUpperCase());
    setSuccessMessage('');
    fetchData(query);
  };

  const handleRetry = () => {
    if (currentTicker) {
      fetchData(currentTicker); // Daten mit dem aktuellen Ticker erneut abrufen
    }
  };

  const openRevenueModal = () => {
    setIsRevenueModalOpen(true);
  };

  const closeRevenueModal = () => {
    setIsRevenueModalOpen(false);
  };

  const openEPSModal = () => {
    setIsEPSModalOpen(true);
  };

  const closeEPSModal = () => {
    setIsEPSModalOpen(false);
  };

  const openFCFModal = () => {
    setIsFCFModalOpen(true);
  };

  const closeFCFModal = () => {
    setIsFCFModalOpen(false);
  };

  const handleViewToggleRevenue = (isAnnual: boolean) => {
    setIsAnnualViewRevenue(isAnnual);
  };

  const handleViewToggleEPS = (isAnnual: boolean) => {
    setIsAnnualViewEPS(isAnnual);
  };

  const handleViewToggleFCF = (isAnnual: boolean) => {
    setIsAnnualViewFCF(isAnnual);
  };

  // Funktion zur Formatierung der Marktkapitalisierung (in Milliarden)
  const formatMarketCap = (marketCap: string) => {
    const marketCapNumber = parseFloat(marketCap);
    if (isNaN(marketCapNumber)) return 'N/A';
    return (marketCapNumber / 1e9).toFixed(2) + ' Mrd. $';
  };

  // Funktion zur Bestimmung der Fehlerursache und Handlungsempfehlung
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

          {loading && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <IonSpinner name="crescent" />
              <p>Lädt Daten... ({Math.round(progress)}%)</p>
              <IonProgressBar value={progress / 100} buffer={1} className="loading-container" style={{ marginTop: '10px' }} />
            </div>
          )}

          {/* Detaillierte Fehlermeldung mit Handlungsempfehlung */}
          {error && (
            <IonCard className="error-card" style={{ margin: '20px 0', border: '1px solid #ff4d4f' }}>
              <IonCardHeader>
                <IonCardTitle style={{ color: '#ff4d4f' }}>Fehler</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Fehlermeldung:</strong> {error}</p>
                <p><strong>Erklärung:</strong> {getErrorDetails(error).explanation}</p>
                <p><strong>Empfehlung:</strong> {getErrorDetails(error).recommendation}</p>
                <IonButton
                  fill="outline"
                  color="danger"
                  onClick={handleRetry}
                  style={{ marginTop: '10px' }}
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  Erneut versuchen
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* Erfolgsmeldung als Toast */}
          <IonToast
            isOpen={!!successMessage}
            message={successMessage}
            duration={3000}
            color="success"
            position="top"
            onDidDismiss={() => setSuccessMessage('')}
          />

          {/* Unternehmensinformationen anzeigen */}
          {companyInfo && (
            <IonCard className="company-info-card" style={{ margin: '20px 0' }}>
              <IonCardHeader>
                <IonCardTitle>{companyInfo.Name} ({currentTicker})</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Branche:</strong> {companyInfo.Industry}</p>
                <p><strong>Sitz:</strong> {companyInfo.Address}</p>
                <p><strong>Marktkapitalisierung:</strong> {formatMarketCap(companyInfo.MarketCapitalization)}</p>
                <p><strong>Aktueller Aktienkurs:</strong> ${companyInfo.LastSale}</p>
              </IonCardContent>
            </IonCard>
          )}

          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="4">
                {mainChartData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openRevenueModal}>
                    <BarChart
                      data={mainChartData}
                      title="Revenue (Annual)"
                    />
                  </div>
                ) : (
                  <p>Keine Umsatzdaten verfügbar.</p>
                )}
              </IonCol>
              <IonCol size="12" size-md="4">
                {mainEPSData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openEPSModal}>
                    <BarChart
                      data={mainEPSData}
                      title="EPS (Annual)"
                    />
                  </div>
                ) : (
                  <p>Keine EPS-Daten verfügbar.</p>
                )}
              </IonCol>
              <IonCol size="12" size-md="4">
                {mainFCFData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openFCFModal}>
                    <BarChart
                      data={mainFCFData}
                      title="FCF (Annual)"
                    />
                  </div>
                ) : (
                  <p>Keine FCF-Daten verfügbar.</p>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Umsatz-Modal */}
          <IonModal ref={revenueModal} isOpen={isRevenueModalOpen} onDidDismiss={closeRevenueModal} className="custom-modal">
            <IonContent className="ion-padding">
              <IonButton fill="clear" className="close-button" onClick={closeRevenueModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
              <div className="modal-header">
                <div className="toggle-container">
                  <IonLabel>Quarterly</IonLabel>
                  <IonToggle
                    checked={isAnnualViewRevenue}
                    onIonChange={(e) => handleViewToggleRevenue(e.detail.checked)}
                  />
                  <IonLabel>Annual</IonLabel>
                </div>
              </div>
              <div className="modal-chart-container">
                <BarChart
                  data={currentChartDataRevenue}
                  title={isAnnualViewRevenue ? "Revenue (Annual)" : "Revenue (Quarterly)"}
                />
              </div>
            </IonContent>
          </IonModal>

          {/* EPS-Modal */}
          <IonModal ref={epsModal} isOpen={isEPSModalOpen} onDidDismiss={closeEPSModal} className="custom-modal">
            <IonContent className="ion-padding">
              <IonButton fill="clear" className="close-button" onClick={closeEPSModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
              <div className="modal-header">
                <div className="toggle-container">
                  <IonLabel>Quarterly</IonLabel>
                  <IonToggle
                    checked={isAnnualViewEPS}
                    onIonChange={(e) => handleViewToggleEPS(e.detail.checked)}
                  />
                  <IonLabel>Annual</IonLabel>
                </div>
              </div>
              <div className="modal-chart-container">
                <BarChart
                  data={currentEPSDataEPS}
                  title={isAnnualViewEPS ? "EPS (Annual)" : "EPS (Quarterly)"}
                />
              </div>
            </IonContent>
          </IonModal>

          {/* FCF-Modal */}
          <IonModal ref={fcfModal} isOpen={isFCFModalOpen} onDidDismiss={closeFCFModal} className="custom-modal">
            <IonContent className="ion-padding">
              <IonButton fill="clear" className="close-button" onClick={closeFCFModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
              <div className="modal-header">
                <div className="toggle-container">
                  <IonLabel>Quarterly</IonLabel>
                  <IonToggle
                    checked={isAnnualViewFCF}
                    onIonChange={(e) => handleViewToggleFCF(e.detail.checked)}
                  />
                  <IonLabel>Annual</IonLabel>
                </div>
              </div>
              <div className="modal-chart-container">
                <BarChart
                  data={currentFCFDataFCF}
                  title={isAnnualViewFCF ? "FCF (Annual)" : "FCF (Quarterly)"}
                />
              </div>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;