import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText } from '@ionic/react'; // IonText hinzugefügt
// Passe den Pfad und Import an, falls KeyMetrics exportiert wurde
import { CompanyInfo, KeyMetrics } from '../hooks/useStockData';

interface CompanyInfoCardProps {
  companyInfo: CompanyInfo;
  ticker: string;
  formatMarketCap: (marketCap: string) => string;
  keyMetrics: KeyMetrics | null; // NEU: keyMetrics als Prop
}

const CompanyInfoCard: React.FC<CompanyInfoCardProps> = ({ companyInfo, ticker, formatMarketCap, keyMetrics }) => {
  return (
    // Inline-Style für margin sollte jetzt in CSS sein
    <IonCard className="company-info-card">
      <IonCardHeader>
        <IonCardTitle>{companyInfo.Name} ({ticker})</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Bestehende Infos */}
        <p><strong>Branche:</strong> {companyInfo.Industry}</p>
        <p><strong>Sitz:</strong> {companyInfo.Address}</p>
        <p><strong>Marktkapitalisierung:</strong> {formatMarketCap(companyInfo.MarketCapitalization)}</p>
        {/* Preis und Preisänderung */}
        <p style={{ marginTop: '10px', fontSize: '1.1em' }}>
            <strong>Aktueller Kurs:</strong> ${companyInfo.LastSale}
            {/* NEU: Preisänderung anzeigen, wenn vorhanden */}
            {keyMetrics && keyMetrics.priceChange !== null && keyMetrics.priceChangePercent !== null && (
              <IonText color={keyMetrics.isPositiveChange ? 'success' : 'danger'} style={{ marginLeft: '10px' }}>
                {/* Zeige Vorzeichen nur wenn nicht 0 */}
                <span> ({parseFloat(keyMetrics.priceChange) >= 0 ? '+' : ''}{keyMetrics.priceChange}$)</span>
                <span> ({keyMetrics.priceChangePercent})</span>
              </IonText>
            )}
        </p>
      </IonCardContent>
    </IonCard>
  );
};

export default CompanyInfoCard;