// src/components/CompanyInfoCard.tsx (Robuster gemacht)
import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText } from '@ionic/react';
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
    // Optional: Eine kleine Ladeanzeige oder null zurückgeben, während companyInfo noch lädt
    // Zum Debuggen ist es besser, null zurückzugeben, um Fehler zu vermeiden
    return null;
  }

  return (
    <IonCard className="company-info-card">
      <IonCardHeader>
         {/* Verwende Fallback für Name */}
        <IonCardTitle>{companyInfo?.Name ?? ticker} ({ticker || 'N/A'})</IonCardTitle> {/* Fallback für Ticker hinzugefügt */}
      </IonCardHeader>
      <IonCardContent>
         {/* Verwende optional chaining und nullish coalescing */}
        <p><strong>Branche:</strong> {companyInfo?.Industry ?? 'N/A'}</p>
        <p><strong>Sitz:</strong> {companyInfo?.Address ?? 'N/A'}</p>
        <p><strong>Marktkapitalisierung:</strong> {formatMarketCap(companyInfo?.MarketCapitalization)}</p> {/* formatMarketCap sollte null prüfen */}
        <p style={{ marginTop: '10px', fontSize: '1.1em' }}>
           <strong>Aktueller Kurs:</strong> ${companyInfo?.LastSale ?? 'N/A'}
           {/* Preisänderung (keyMetrics kann auch null sein) */}
           {keyMetrics && keyMetrics.priceChange !== null && keyMetrics.priceChangePercent !== null && (
             <IonText color={keyMetrics.isPositiveChange ? 'success' : 'danger'} style={{ marginLeft: '10px' }}>
               {/* Stelle sicher, dass priceChange existiert, bevor parseFloat versucht wird */}
               <span> ({keyMetrics.priceChange && parseFloat(keyMetrics.priceChange) >= 0 ? '+' : ''}{keyMetrics.priceChange}$)</span>
               <span> ({keyMetrics.priceChangePercent})</span>
             </IonText>
           )}
        </p>
      </IonCardContent>
    </IonCard>
  );
};

export default CompanyInfoCard;