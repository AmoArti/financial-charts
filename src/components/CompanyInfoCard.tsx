// src/components/CompanyInfoCard.tsx (Angepasst für Item/Label/Note Layout)
import React from 'react';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText,
  IonItem, IonLabel, IonNote // IonItem, IonLabel, IonNote hinzugefügt
} from '@ionic/react';
import { CompanyInfo, KeyMetrics } from '../hooks/useStockData'; // Passe Pfad ggf. an

interface CompanyInfoCardProps {
  companyInfo: CompanyInfo | null; // Erlaube null explizit
  ticker: string;
  formatMarketCap: (marketCap: string | null | undefined) => string; // Erlaube null/undefined
  keyMetrics: KeyMetrics | null;
}

const CompanyInfoCard: React.FC<CompanyInfoCardProps> = ({ companyInfo, ticker, formatMarketCap, keyMetrics }) => {
  // Früher Ausstieg oder Standardwerte, wenn companyInfo null ist
  if (!companyInfo) {
    return null;
  }

  // Hilfsfunktion zum sicheren Parsen von priceChange
  const parsePriceChange = (value: string | null | undefined): number => {
    if (value === null || value === undefined) return NaN;
    return parseFloat(value);
  };
  const numPriceChange = parsePriceChange(keyMetrics?.priceChange);


  return (
    // className wird von Home.css genutzt, um Hintergrund etc. zu entfernen/anzupassen
    <IonCard className="company-info-card">
      <IonCardHeader>
        {/* Titel bleibt normal */}
        <IonCardTitle>{companyInfo?.Name ?? ticker} ({ticker || 'N/A'})</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* *** NEUE STRUKTUR für Details mit IonItem *** */}

        <IonItem lines="none">
          <IonLabel>Branche</IonLabel>
          <IonNote slot="end">{companyInfo?.Industry ?? 'N/A'}</IonNote>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>Sitz</IonLabel>
          {/* Style für potenziell lange Adressen */}
          <IonNote slot="end" style={{ whiteSpace: 'normal', textAlign: 'right' }}>
            {companyInfo?.Address ?? 'N/A'}
          </IonNote>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>Marktkapitalisierung</IonLabel>
          <IonNote slot="end">{formatMarketCap(companyInfo?.MarketCapitalization)}</IonNote>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>Aktueller Kurs</IonLabel>
          {/* Verwende ein div für den kombinierten Wert und die Änderung rechts */}
          <div slot="end" style={{ textAlign: 'right' }}>
            <IonText>${companyInfo?.LastSale ?? 'N/A'}</IonText>
            {/* Preisänderung (keyMetrics kann auch null sein) */}
            {keyMetrics && keyMetrics.priceChange !== null && keyMetrics.priceChangePercent !== null && (
              <IonText color={keyMetrics.isPositiveChange ? 'success' : 'danger'} style={{ marginLeft: '8px' }}>
                 {/* Sicherstellen, dass priceChange existiert & gültig ist für das Vorzeichen */}
                 <span>({!isNaN(numPriceChange) && numPriceChange >= 0 ? '+' : ''}{keyMetrics.priceChange}$)</span>
                 {/* Prozentuale Änderung */}
                 <span style={{ marginLeft: '5px' }}>({keyMetrics.priceChangePercent})</span>
               </IonText>
            )}
          </div>
        </IonItem>

        {/* Alte <p>-Tags entfernt */}

      </IonCardContent>
    </IonCard>
  );
};

export default CompanyInfoCard;