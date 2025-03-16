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
  const [isAnnualView, setIsAnnualView] = useState(true);
  const [currentChartData, setCurrentChartData] = useState<StockData>({ labels: [], values: [] });
  const [currentEPSData, setCurrentEPSData] = useState<StockData>({ labels: [], values: [] });
  const revenueModal = useRef<HTMLIonModalElement>(null);
  const epsModal = useRef<HTMLIonModalElement>(null);

  useEffect(() => {
    setCurrentChartData(isAnnualView ? annualData : quarterlyData);
    setCurrentEPSData(isAnnualView ? annualEPS : quarterlyEPS);
  }, [annualData, quarterlyData, annualEPS, quarterlyEPS, isAnnualView]);

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

  const handleViewToggle = (isAnnual: boolean) => {
    setIsAnnualView(isAnnual);
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
                {currentChartData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openRevenueModal}>
                    <BarChart
                      data={currentChartData}
                      title={isAnnualView ? "Revenue (Annual)" : "Revenue (Quarterly)"}
                    />
                  </div>
                ) : (
                  <p>Keine Umsatzdaten verfügbar.</p>
                )}
              </IonCol>
              <IonCol size="12" size-md="6">
                {currentEPSData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openEPSModal}>
                    <BarChart
                      data={currentEPSData}
                      title={isAnnualView ? "EPS (Annual)" : "EPS (Quarterly)"}
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
                    checked={isAnnualView}
                    onIonChange={(e) => handleViewToggle(e.detail.checked)}
                  />
                  <IonLabel>Annual</IonLabel>
                </div>
              </div>
              <div className="modal-chart-container">
                <BarChart
                  data={currentChartData}
                  title={isAnnualView ? "Revenue (Annual)" : "Revenue (Quarterly)"}
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
                    checked={isAnnualView}
                    onIonChange={(e) => handleViewToggle(e.detail.checked)}
                  />
                  <IonLabel>Annual</IonLabel>
                </div>
              </div>
              <div className="modal-chart-container">
                <BarChart
                  data={currentEPSData}
                  title={isAnnualView ? "EPS (Annual)" : "EPS (Quarterly)"}
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