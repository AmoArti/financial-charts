// src/components/KeyStatsDashboard.tsx
import React from 'react';
import { IonGrid, IonRow, IonCol, IonText, IonItem, IonLabel, IonNote } from '@ionic/react';
import { CompanyInfo, KeyMetrics, BalanceSheetMetrics } from '../types/stockDataTypes';
import './KeyStatsDashboard.css';

interface KeyStatsDashboardProps {
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null;
  balanceSheetMetrics: BalanceSheetMetrics | null;
  ticker: string;
  formatMarketCap: (marketCap: string | null | undefined) => string;
}

const KeyStatsDashboard: React.FC<KeyStatsDashboardProps> = ({
  companyInfo,
  keyMetrics,
  balanceSheetMetrics,
  ticker,
  formatMarketCap,
}) => {
  if (!companyInfo) {
    return null;
  }

  const numPriceChange = parseFloat(keyMetrics?.priceChange || '');

  return (
    <div className="key-stats-container">
      <div className="company-header">
        <div className="company-name-section">
          <h1>{companyInfo.Name} <span>({ticker})</span></h1>
          <p>Earnings: {companyInfo.EarningsDate || 'N/A'}</p>
        </div>
        <div className="company-price-section">
          <span className="price">${companyInfo.LastSale}</span>
          {keyMetrics && (
            <IonText color={keyMetrics.isPositiveChange ? 'success' : 'danger'} className="price-change">
              <span>{numPriceChange >= 0 ? '+' : ''}{keyMetrics.priceChange}</span>
              <span className="percent-change">({keyMetrics.priceChangePercent})</span>
            </IonText>
          )}
        </div>
      </div>

      <IonGrid className="stats-grid">
        <IonRow>
          <IonCol size="12" size-md="3" className="stats-col">
            <h2 className="stats-title">Valuation</h2>
            <IonItem lines="none"><IonLabel>Market Cap</IonLabel><IonNote slot="end">{formatMarketCap(companyInfo.MarketCapitalization)}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>P/E Ratio</IonLabel><IonNote slot="end">{keyMetrics?.peRatio ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>P/S Ratio</IonLabel><IonNote slot="end">{keyMetrics?.psRatio ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>P/B Ratio</IonLabel><IonNote slot="end">{keyMetrics?.pbRatio ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>EV to EBITDA</IonLabel><IonNote slot="end">{keyMetrics?.evToEbitda ?? 'N/A'}</IonNote></IonItem>
          </IonCol>

          <IonCol size="12" size-md="3" className="stats-col">
            <h2 className="stats-title">Balance</h2>
            <IonItem lines="none"><IonLabel>Cash</IonLabel><IonNote slot="end">{balanceSheetMetrics?.cash ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>Debt</IonLabel><IonNote slot="end">{balanceSheetMetrics?.debt ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>Net Debt</IonLabel><IonNote slot="end">{balanceSheetMetrics?.netDebt ?? 'N/A'}</IonNote></IonItem>
            <h2 className="stats-title secondary-title">Cash Flow</h2>
            <IonItem lines="none"><IonLabel>FCF Yield</IonLabel><IonNote slot="end">{keyMetrics?.freeCashFlowYield ?? 'N/A'}</IonNote></IonItem>
          </IonCol>
          
          <IonCol size="12" size-md="3" className="stats-col">
            <h2 className="stats-title">Margins & Growth</h2>
            <IonItem lines="none"><IonLabel>Profit Margin</IonLabel><IonNote slot="end">{keyMetrics?.grossMargin ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>Operating Margin</IonLabel><IonNote slot="end">{keyMetrics?.operatingMargin ?? 'N/A'}</IonNote></IonItem>
          </IonCol>

          <IonCol size="12" size-md="3" className="stats-col">
            <h2 className="stats-title">Dividend</h2>
            <IonItem lines="none"><IonLabel>Dividend Yield</IonLabel><IonNote slot="end">{keyMetrics?.dividendYield ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>Payout Ratio</IonLabel><IonNote slot="end">{keyMetrics?.payoutRatio ?? 'N/A'}</IonNote></IonItem>
            <IonItem lines="none"><IonLabel>Payout Date</IonLabel><IonNote slot="end">{keyMetrics?.payoutDate ?? 'N/A'}</IonNote></IonItem>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default KeyStatsDashboard;