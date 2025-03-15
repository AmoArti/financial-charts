// src/pages/Home.tsx
import React, { useState, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonModal, IonButton, IonIcon, IonToggle, IonLabel, IonSpinner } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import { useStockData } from '../hooks/useStockData';
import { useEffect } from 'react';
import './Home.css';

interface StockData {
  labels: (string | number)[];
  values: number[];
}

const Home: React.FC = () => {
  const { chartData, annualData, quarterlyData, loading, error, fetchData } = useStockData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnnualView, setIsAnnualView] = useState(true);
  const [currentChartData, setCurrentChartData] = useState<StockData>(chartData);
  const modal = useRef<HTMLIonModalElement>(null);

  const handleSearch = (query: string) => {
    fetchData(query);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleViewToggle = (isAnnual: boolean) => {
    setIsAnnualView(isAnnual);
    setCurrentChartData(isAnnual ? annualData : quarterlyData);
  };

  useEffect(() => {
    setCurrentChartData(isAnnualView ? annualData : quarterlyData);
  }, [annualData, quarterlyData, isAnnualView]);

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
              <IonCol size="12" size-md="8">
                {currentChartData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openModal}>
                    <BarChart
                      data={currentChartData}
                      title={isAnnualView ? "Revenue (Annual)" : "Revenue (Quarterly)"}
                    />
                  </div>
                ) : (
                  <p>Keine Daten verfügbar. Bitte suche nach einem Ticker (z. B. AAPL).</p>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonModal ref={modal} isOpen={isModalOpen} onDidDismiss={closeModal} className="custom-modal">
            <IonContent className="ion-padding">
              <IonButton fill="clear" className="close-button" onClick={closeModal}>
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;