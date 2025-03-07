import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol } from '@ionic/react';
import SearchBar from '../components/SearchBar';
import BarChart from '../components/BarChart';

const Home: React.FC = () => {
  const [chartData, setChartData] = useState({
    labels: ['Value', 'Quality', 'Momentum', 'Volatility'],
    values: [75, 60, 85, 40], // Beispielwerte, später von der API
  });

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Hier würdest du die API aufrufen und die chartData aktualisieren
    // Beispiel: fetchFinancialData(query).then(data => setChartData(data));
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
        
        {/* Suchleiste */}
        <SearchBar onSearch={handleSearch} />

        {/* Grid-Layout für Diagramme */}
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="6">
              <BarChart
                data={chartData}
                title="Financial Metrics"
              />
            </IonCol>
            {/* Füge hier weitere Diagramme hinzu, falls gewünscht */}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;