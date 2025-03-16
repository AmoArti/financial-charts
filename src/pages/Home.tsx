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
  const { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, loading, error, fetchData } = useStockData();
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isEPSModalOpen, setIsEPSModalOpen] = useState(false);
  const [isAnnualViewRevenue, setIsAnnualViewRevenue] = useState(true); // Zustand für das Revenue-Modal
  const [isAnnualViewEPS, setIsAnnualViewEPS] = useState(true); // Zustand für das EPS-Modal
  const [currentChartDataRevenue, setCurrentChartDataRevenue] = useState<StockData>({ labels: [], values: [] }); // Daten für das Revenue-Modal
  const [currentEPSDataEPS, setCurrentEPSDataEPS] = useState<StockData>({ labels: [], values: [] }); // Daten für das EPS-Modal
  const revenueModal = useRef<HTMLIonModalElement>(null);
  const epsModal = useRef<HTMLIonModalElement>(null);

  // Hauptseite zeigt immer Annual-Daten
  const mainChartData = annualData; // Festgelegt auf Annual-Daten für die Hauptseite
  const mainEPSData = annualEPS; // Festgelegt auf Annual-Daten für die Hauptseite

  // Daten für die Modals aktualisieren
  useEffect(() => {
    setCurrentChartDataRevenue(isAnnualViewRevenue ? annualData : quarterlyData);
    setCurrentEPSDataEPS(isAnnualViewEPS ? annualEPS : quarterlyEPS);
    console.log("Revenue Modal Data:", isAnnualViewRevenue ? annualData : quarterlyData);
    console.log("EPS Modal Data:", isAnnualViewEPS ? annualEPS : quarterlyEPS);
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, isAnnualViewRevenue, isAnnualViewEPS]);

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

  const handleViewToggleRevenue = (isAnnual: boolean) => {
    setIsAnnualViewRevenue(isAnnual); // Nur für das Revenue-Modal
  };

  const handleViewToggleEPS = (isAnnual: boolean) => {
    setIsAnnualViewEPS(isAnnual); // Nur für das EPS-Modal
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
              <IonCol size="12" size-md="6">
                {mainChartData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openRevenueModal}>
                    <BarChart
                      data={mainChartData} // Immer Annual-Daten für die Hauptseite
                      title="Revenue (Annual)"
                    />
                  </div>
                ) : (
                  <p>Keine Umsatzdaten verfügbar.</p>
                )}
              </IonCol>
              <IonCol size="12" size-md="6">
                {mainEPSData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openEPSModal}>
                    <BarChart
                      data={mainEPSData} // Immer Annual-Daten für die Hauptseite
                      title="EPS (Annual)"
                    />
                  </div>
                ) : (
                  <p>Keine EPS-Daten verfügbar.</p>
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;