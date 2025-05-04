// src/components/KeyMetricsList.tsx
import React from 'react';
import { IonList, IonItem, IonLabel, IonNote } from '@ionic/react';
import { KeyMetrics } from '../hooks/useStockData'; // Importiere den Typ

// Interface für die Props der Komponente
interface KeyMetricsListProps {
  keyMetrics: KeyMetrics | null; // Die Komponente erhält das keyMetrics-Objekt (oder null)
}

const KeyMetricsList: React.FC<KeyMetricsListProps> = ({ keyMetrics }) => {

  // Wenn keine keyMetrics vorhanden sind, rendere nichts (oder eine Meldung)
  if (!keyMetrics) {
    // Optional: Zeige eine Meldung an, wenn companyInfo geladen ist, aber keyMetrics fehlen
    // Diese Logik hängt davon ab, was im Parent (Home.tsx) entschieden wird.
    // Für eine reine Darstellungskomponente ist null oft am sichersten.
    return null;
    // Alternative:
    // return (
    //   <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
    //     <IonItem lines="none"><IonLabel color="medium">Kennzahlen nicht verfügbar.</IonLabel></IonItem>
    //   </IonList>
    // );
  }

  // Wenn keyMetrics vorhanden sind, rendere die Liste
  return (
    <IonList inset={true} style={{ marginTop: '20px', marginBottom: '0px', '--ion-item-background': '#f9f9f9', borderRadius: '8px' }}>
      <IonItem lines="full"><IonLabel color="medium">Kennzahlen</IonLabel></IonItem>
      <IonItem>
        <IonLabel>KGV (P/E Ratio)</IonLabel>
        <IonNote slot="end">{keyMetrics.peRatio ?? 'N/A'}</IonNote>
      </IonItem>
      <IonItem>
        <IonLabel>KUV (P/S Ratio)</IonLabel>
        <IonNote slot="end">{keyMetrics.psRatio ?? 'N/A'}</IonNote>
      </IonItem>
      <IonItem>
        <IonLabel>KBV (P/B Ratio)</IonLabel>
        <IonNote slot="end">{keyMetrics.pbRatio ?? 'N/A'}</IonNote>
      </IonItem>
      <IonItem>
        <IonLabel>EV/EBITDA</IonLabel>
        <IonNote slot="end">{keyMetrics.evToEbitda ?? 'N/A'}</IonNote>
      </IonItem>
      <IonItem>
        <IonLabel>Bruttomarge</IonLabel>
        <IonNote slot="end">{keyMetrics.grossMargin ?? 'N/A'}</IonNote>
      </IonItem>
      <IonItem>
        <IonLabel>Operative Marge</IonLabel>
        <IonNote slot="end">{keyMetrics.operatingMargin ?? 'N/A'}</IonNote>
      </IonItem>
      <IonItem lines="none">
        <IonLabel>Dividendenrendite</IonLabel>
        <IonNote slot="end">{keyMetrics.dividendYield ?? 'N/A'}</IonNote>
      </IonItem>
    </IonList>
  );
};

export default KeyMetricsList;