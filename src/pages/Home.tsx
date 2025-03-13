import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonModal, IonButton, IonIcon, IonToggle, IonLabel } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import './Home.css';

const Home: React.FC = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    values: [],
  });
  const [annualData, setAnnualData] = useState({ labels: [], values: [] });
  const [quarterlyData, setQuarterlyData] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnnualView, setIsAnnualView] = useState(true); // Standardmäßig Jahresansicht

  const modal = useRef<HTMLIonModalElement>(null);

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const fetchStockData = async (ticker: string) => {
    if (!apiKey) {
      setError('API-Schlüssel nicht gefunden. Bitte überprüfe die .env-Datei.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`
      );
      const data = await response.json();

      if (data['Error Message'] || (!data['annualReports'] && !data['quarterlyReports'])) {
        throw new Error('Ungültiger Ticker oder API-Fehler');
      }

      // Jährliche Daten
      const annualReports = data['annualReports'] || [];
      const annualYears = annualReports
        .map(report => parseInt(report.fiscalDateEnding.split('-')[0]))
        .sort((a, b) => a - b);
      const currentYear = new Date().getFullYear();
      const last10Years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
      const annualRevenue = last10Years.map(year => {
        const report = annualReports.find(r => parseInt(r.fiscalDateEnding.split('-')[0]) === year);
        return report ? parseFloat(report.totalRevenue) / 1e9 || 0 : 0;
      });

      setAnnualData({
        labels: last10Years,
        values: annualRevenue,
      });

      // Quartalsweise Daten
      const quarterlyReports = data['quarterlyReports'] || [];
      const quarterlyLabels = quarterlyReports
        .map(report => report.fiscalDateEnding)
        .slice(0, 12)
        .reverse();
      const quarterlyRevenue = quarterlyReports
        .map(report => parseFloat(report.totalRevenue) / 1e9 || 0)
        .slice(0, 12)
        .reverse();

      setQuarterlyData({
        labels: quarterlyLabels,
        values: quarterlyRevenue,
      });

      // Standardmäßig Jahresdaten anzeigen
      setChartData({
        labels: last10Years,
        values: annualRevenue,
      });
    } catch (err) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    fetchStockData(query);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleViewToggle = (isAnnual: boolean) => {
    setIsAnnualView(isAnnual);
    setChartData(isAnnual ? annualData : quarterlyData);
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

          {loading && <p>Lädt Daten...</p>}
          {error && <p style={{ color: 'red' }}>Fehler: {error}</p>}

          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="8">
                {chartData.labels.length > 0 ? (
                  <div className="chart-container" onClick={openModal}>
                    <BarChart
                      data={chartData}
                      title={isAnnualView ? "Revenue (Annual)" : "Revenue (Quarterly)"}
                    />
                  </div>
                ) : (
                  <p>Keine Daten verfügbar. Bitte suche nach einem Ticker (z. B. AAPL).</p>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Modal mit Switch */}
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
                  data={chartData}
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