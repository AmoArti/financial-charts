// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonModal, IonButton, IonIcon, IonToggle, IonLabel, IonSpinner, IonProgressBar, IonToast } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import { useStockData } from '../hooks/useStockData';
import './Home.css';

interface StockData {
  labels: (string | number)[];
  values: number[];
}

const Home: React.FC = () => {
  const { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, fetchData } = useStockData();
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isEPSModalOpen, setIsEPSModalOpen] = useState(false);
  const [isFCFModalOpen, setIsFCFModalOpen] = useState(false);
  const [isAnnualViewRevenue, setIsAnnualViewRevenue] = useState(true);
  const [isAnnualViewEPS, setIsAnnualViewEPS] = useState(true);
  const [isAnnualViewFCF, setIsAnnualViewFCF] = useState(true);
  const [currentChartDataRevenue, setCurrentChartDataRevenue] = useState<StockData>({ labels: [], values: [] });
  const [currentEPSDataEPS, setCurrentEPSDataEPS] = useState<StockData>({ labels: [], values: [] });
  const [currentFCFDataFCF, setCurrentFCFDataFCF] = useState<StockData>({ labels: [], values: [] });
  const [currentTicker, setCurrentTicker] = useState<string>(''); // Für die Erfolgsmeldung
  const [successMessage, setSuccessMessage] = useState<string>(''); // Für die Erfolgsmeldung
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
    setSuccessMessage(''); // Erfolgsmeldung zurücksetzen
    fetchData(query);
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
              <IonProgressBar value={progress / 100} buffer={1} style={{ marginTop: '10px' }} />
            </div>
          )}
          {error && <p style={{ color: 'red' }}>Fehler: {error}</p>}

          {/* Erfolgsmeldung als Toast */}
          <IonToast
            isOpen={!!successMessage}
            message={successMessage}
            duration={3000} // 3 Sekunden anzeigen
            color="success"
            position="top"
            onDidDismiss={() => setSuccessMessage('')}
          />

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