// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonModal, IonButton, IonIcon, IonToggle, IonLabel, IonSpinner } from '@ionic/react';
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
  const { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, fetchData } = useStockData();
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isEPSModalOpen, setIsEPSModalOpen] = useState(false);
  const [isFCFModalOpen, setIsFCFModalOpen] = useState(false); // Neu: FCF-Modal
  const [isAnnualViewRevenue, setIsAnnualViewRevenue] = useState(true);
  const [isAnnualViewEPS, setIsAnnualViewEPS] = useState(true);
  const [isAnnualViewFCF, setIsAnnualViewFCF] = useState(true); // Neu: Zustand für FCF-Modal
  const [currentChartDataRevenue, setCurrentChartDataRevenue] = useState<StockData>({ labels: [], values: [] });
  const [currentEPSDataEPS, setCurrentEPSDataEPS] = useState<StockData>({ labels: [], values: [] });
  const [currentFCFDataFCF, setCurrentFCFDataFCF] = useState<StockData>({ labels: [], values: [] }); // Neu: Daten für FCF-Modal
  const revenueModal = useRef<HTMLIonModalElement>(null);
  const epsModal = useRef<HTMLIonModalElement>(null);
  const fcfModal = useRef<HTMLIonModalElement>(null); // Neu: Ref für FCF-Modal

  // Hauptseite zeigt immer Annual-Daten
  const mainChartData = annualData;
  const mainEPSData = annualEPS;
  const mainFCFData = annualFCF; // Neu: FCF-Daten für die Hauptseite

  // Daten für die Modals aktualisieren
  useEffect(() => {
    setCurrentChartDataRevenue(isAnnualViewRevenue ? annualData : quarterlyData);
    setCurrentEPSDataEPS(isAnnualViewEPS ? annualEPS : quarterlyEPS);
    setCurrentFCFDataFCF(isAnnualViewFCF ? annualFCF : quarterlyFCF); // Neu: FCF-Daten für Modal
    console.log("Revenue Modal Data:", isAnnualViewRevenue ? annualData : quarterlyData);
    console.log("EPS Modal Data:", isAnnualViewEPS ? annualEPS : quarterlyEPS);
    console.log("FCF Modal Data:", isAnnualViewFCF ? annualFCF : quarterlyFCF);
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, isAnnualViewRevenue, isAnnualViewEPS, isAnnualViewFCF]);

  const handleSearch = (query: string) => {
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

  const openFCFModal = () => { // Neu: Funktion für FCF-Modal
    setIsFCFModalOpen(true);
  };

  const closeFCFModal = () => { // Neu: Funktion für FCF-Modal
    setIsFCFModalOpen(false);
  };

  const handleViewToggleRevenue = (isAnnual: boolean) => {
    setIsAnnualViewRevenue(isAnnual);
  };

  const handleViewToggleEPS = (isAnnual: boolean) => {
    setIsAnnualViewEPS(isAnnual);
  };

  const handleViewToggleFCF = (isAnnual: boolean) => { // Neu: Funktion für FCF-Modal
    setIsAnnualViewFCF(isAnnual);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Financial Charts</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Financial Charts</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ padding: '20px' }}>
          <SearchBar onSearch={handleSearch} />

          {loading && (
            <div style={{ textAlign: 'center' }}>
              <IonSpinner name="crescent" />
              <p>Lädt Daten...</p>
            </div>
          )}
          {error && <p style={{ color: 'red' }}>Fehler: {error}</p>}

          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="4"> {/* Anpassung: 4 statt 6, um Platz für 3 Charts zu schaffen */}
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
              <IonCol size="12" size-md="4"> {/* Anpassung: 4 statt 6 */}
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
              <IonCol size="12" size-md="4"> {/* Neu: Dritte Spalte für FCF */}
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