import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonModal, IonButton, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons'; // Icon für das "X"
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';
import './Home.css';

const Home: React.FC = () => {
  const [chartData, setChartData] = useState({
    labels: [], // Wird mit den letzten 10 Jahren gefüllt
    values: [], // Wird mit geschätztem Umsatz in Milliarden gefüllt
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modal = useRef<HTMLIonModalElement>(null);

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
  console.log('API Key in Home.tsx:', apiKey);

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
      console.log('API Response (Income Statement):', data);

      if (data['Error Message'] || !data['annualReports']) {
        const dailyResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}`
        );
        const dailyData = await dailyResponse.json();
        console.log('API Response (Daily as Fallback):', dailyData);

        if (dailyData['Error Message'] || !dailyData['Time Series (Daily)']) {
          throw new Error('Ungültiger Ticker oder API-Fehler');
        }

        const timeSeries = dailyData['Time Series (Daily)'];
        const dates = Object.keys(timeSeries);
        const availableYears = dates
          .map(date => new Date(date).getFullYear())
          .filter((year, index, self) => self.indexOf(year) === index)
          .sort((a, b) => a - b);

        // Stelle sicher, dass wir 10 Jahre haben (falls weniger, füllen wir mit Platzhaltern)
        const currentYear = new Date().getFullYear();
        const last10Years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
        const simulatedRevenue = last10Years.map(year => {
          if (availableYears.includes(year)) {
            return availableYears.indexOf(year) * 10 + 50; // Platzhalter basierend auf Index
          }
          return 0; // 0 für Jahre ohne Daten
        });

        setChartData({
          labels: last10Years,
          values: simulatedRevenue,
        });
      } else {
        const reports = data['annualReports'] || [];
        const availableYears = reports
          .map(report => parseInt(report.fiscalDateEnding.split('-')[0]))
          .filter((year, index, self) => self.indexOf(year) === index)
          .sort((a, b) => a - b);

        const currentYear = new Date().getFullYear();
        const last10Years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
        const revenueData = last10Years.map(year => {
          const report = reports.find(r => parseInt(r.fiscalDateEnding.split('-')[0]) === year);
          return report ? parseFloat(report.totalRevenue) / 1e9 || 0 : 0; // Umsatz in Milliarden oder 0
        });

        setChartData({
          labels: last10Years,
          values: revenueData,
        });
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Search triggered with query:', query);
    fetchStockData(query);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
          <h2>Debugging-Informationen:</h2>
          <p>API Key: {apiKey || 'Nicht geladen'}</p>
          <p>Chart Data: {JSON.stringify(chartData)}</p>

          {/* Suchleiste */}
          <SearchBar onSearch={handleSearch} />

          {loading && <p>Lädt Daten...</p>}
          {error && <p style={{ color: 'red' }}>Fehler: {error}</p>}

          {/* Grid-Layout für Diagramme */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="8">
                {chartData && chartData.values.length > 0 ? (
                  <div className="chart-container" onClick={openModal}>
                    <BarChart
                      data={chartData}
                      title="Revenue (in Billions) Over 10 Years"
                    />
                  </div>
                ) : (
                  <p>Keine Daten verfügbar. Bitte suche nach einem Ticker (z. B. AAPL).</p>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Modal für erweitertes Chart */}
          <IonModal ref={modal} isOpen={isModalOpen} onDidDismiss={closeModal} className="custom-modal">
            <IonContent className="ion-padding">
              <IonButton fill="clear" className="close-button" onClick={closeModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
              <div className="modal-chart-container">
                <BarChart
                  data={chartData}
                  title="Revenue (in Billions) Over 10 Years"
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