import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';

const Home: React.FC = () => {
  const [chartData, setChartData] = useState({
    labels: [], // Wird mit den letzten 10 Jahren gefüllt
    values: [], // Wird mit geschätztem Umsatz in Milliarden gefüllt
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Versuche, Income Statement zu nutzen (falls verfügbar)
      const response = await fetch(
        `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`
      );
      const data = await response.json();
      console.log('API Response (Income Statement):', data);

      if (data['Error Message'] || !data['annualReports']) {
        // Fallback auf TIME_SERIES_DAILY, wenn Income Statement fehlschlägt
        const dailyResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}`
        );
        const dailyData = await dailyResponse.json();
        console.log('API Response (Daily as Fallback):', dailyData);

        if (dailyData['Error Message'] || !dailyData['Time Series (Daily)']) {
          throw new Error('Ungültiger Ticker oder API-Fehler');
        }

        // Simuliere Umsatz basierend auf Kursdaten (ungenau, nur als Placeholder)
        const timeSeries = dailyData['Time Series (Daily)'];
        const dates = Object.keys(timeSeries);
        const last10Years = dates
          .map(date => new Date(date).getFullYear())
          .filter((year, index, self) => self.indexOf(year) === index) // Unique Jahre
          .slice(0, 10) // Letzte 10 Jahre
          .sort((a, b) => a - b); // Aufsteigend sortieren

        const simulatedRevenue = last10Years.map((year, index) => index * 10 + 50); // Platzhalter-Werte (in Milliarden)
        setChartData({
          labels: last10Years,
          values: simulatedRevenue,
        });
      } else {
        // Verarbeite Income Statement-Daten (falls verfügbar)
        const reports = data['annualReports'] || [];
        const last10Years = reports
          .slice(0, 10)
          .map(report => parseInt(report.fiscalDateEnding.split('-')[0])) // Extrahiere Jahr
          .filter((year, index, self) => self.indexOf(year) === index) // Unique Jahre
          .sort((a, b) => a - b); // Aufsteigend sortieren

        const revenueData = reports
          .slice(0, 10)
          .map(report => parseFloat(report.totalRevenue) / 1e9 || 0); // Umsatz in Milliarden

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
                  <BarChart
                    data={chartData}
                    title="Revenue (in Billions) Over 10 Years"
                  />
                ) : (
                  <p>Keine Daten verfügbar. Bitte suche nach einem Ticker (z. B. AAPL).</p>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;