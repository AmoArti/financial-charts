// src/components/CompanyInfoCard.tsx
import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { CompanyInfo } from '../hooks/useStockData';

interface CompanyInfoCardProps {
  companyInfo: CompanyInfo;
  ticker: string;
  formatMarketCap: (marketCap: string) => string;
}

const CompanyInfoCard: React.FC<CompanyInfoCardProps> = ({ companyInfo, ticker, formatMarketCap }) => {
  return (
    <IonCard className="company-info-card" style={{ margin: '20px 0' }}>
      <IonCardHeader>
        <IonCardTitle>{companyInfo.Name} ({ticker})</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p><strong>Branche:</strong> {companyInfo.Industry}</p>
        <p><strong>Sitz:</strong> {companyInfo.Address}</p>
        <p><strong>Marktkapitalisierung:</strong> {formatMarketCap(companyInfo.MarketCapitalization)}</p>
        <p><strong>Aktueller Aktienkurs:</strong> ${companyInfo.LastSale}</p>
      </IonCardContent>
    </IonCard>
  );
};

export default CompanyInfoCard;