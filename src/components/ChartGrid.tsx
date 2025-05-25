// src/components/ChartGrid.tsx
import React from 'react';
import {
  IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon
} from '@ionic/react';
import { expandOutline } from 'ionicons/icons';
import BarChart from './BarChart';
import { MultiDatasetStockData } from '../hooks/useStockData'; // Pfad ggf. anpassen

interface ModalChartConfig {
  title: string;
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
}

interface ChartGridProps {
  loading: boolean;
  viewMode: 'annual' | 'quarterly';
  incomeData: MultiDatasetStockData;
  cashflowData: MultiDatasetStockData;
  marginsData: MultiDatasetStockData;
  epsData: MultiDatasetStockData;
  sharesData: MultiDatasetStockData;
  debtToEquityData: MultiDatasetStockData;
  paysDividends: boolean;
  totalDividendsData: MultiDatasetStockData;
  dpsData: MultiDatasetStockData;
  onExpandChart: (data: MultiDatasetStockData, config: ModalChartConfig) => void;
}

const ChartGrid: React.FC<ChartGridProps> = ({
  loading, viewMode, incomeData, cashflowData, marginsData, epsData,
  sharesData, debtToEquityData, paysDividends, totalDividendsData, dpsData,
  onExpandChart
}) => {
  const chartViewModeLabel = viewMode === 'annual' ? 'Annual' : 'Quarterly';

  const chartConfigs = {
    income: { title: `Income Statement (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
    cashflow: { title: `Cash Flow Statement (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
    margins: { title: `Margins (${chartViewModeLabel})`, yAxisFormat: 'percent', yAxisLabel: 'Margin (%)' } as ModalChartConfig,
    eps: { title: `EPS (${chartViewModeLabel})`, yAxisFormat: 'number', yAxisLabel: 'EPS ($)' } as ModalChartConfig,
    shares: { title: `Outstanding Shares (${chartViewModeLabel})`, yAxisFormat: 'ratio', yAxisLabel: 'Shares (Millions)' } as ModalChartConfig,
    debtToEquity: { title: `Debt-to-Equity Ratio (${chartViewModeLabel})`, yAxisFormat: 'ratio', yAxisLabel: 'D/E Ratio' } as ModalChartConfig,
    totalDividends: { title: `Total Dividends Paid (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
    dps: { title: `Dividend Per Share (${chartViewModeLabel})`, yAxisFormat: 'number', yAxisLabel: 'DPS ($)' } as ModalChartConfig,
  };

  const canShowTotalDividends = paysDividends && totalDividendsData?.labels?.length > 0 && totalDividendsData.datasets[0]?.values?.length > 0;
  const canShowDps = dpsData?.labels?.length > 0 && dpsData.datasets[0]?.values?.length > 0;

  const renderHeaderContent = (title: string, onExpandClick: () => void, chartKey: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <IonCardTitle style={{ flexGrow: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </IonCardTitle>
      <IonButton fill="clear" color="dark" onClick={onExpandClick} className="expand-chart-button" style={{ flexShrink: 0 }} aria-label={`Expand ${title}`}>
        <IonIcon slot="icon-only" icon={expandOutline} />
      </IonButton>
    </div>
  );

  return (
    <IonGrid fixed={true}>
      {/* Row 1 */}
      <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
              {renderHeaderContent(chartConfigs.income.title, () => onExpandChart(incomeData, chartConfigs.income), 'income')}
            </IonCardHeader>
            <IonCardContent>
              {incomeData?.labels?.length > 0 && incomeData.datasets.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={incomeData} title={chartConfigs.income.title} yAxisFormat={chartConfigs.income.yAxisFormat} yAxisLabel={chartConfigs.income.yAxisLabel} />
                </div>
              ) : !loading && (<p>Keine Income Statement Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
           <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.cashflow.title, () => onExpandChart(cashflowData, chartConfigs.cashflow), 'cashflow')}
            </IonCardHeader>
            <IonCardContent>
              {cashflowData?.labels?.length > 0 && cashflowData.datasets.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={cashflowData} title={chartConfigs.cashflow.title} yAxisFormat={chartConfigs.cashflow.yAxisFormat} yAxisLabel={chartConfigs.cashflow.yAxisLabel} />
                </div>
              ) : !loading && ( <p>Keine Cashflow Daten verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>

      {/* Row 2 */}
      <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.margins.title, () => onExpandChart(marginsData, chartConfigs.margins), 'margins')}
            </IonCardHeader>
            <IonCardContent>
              {marginsData?.labels?.length > 0 && marginsData.datasets.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={marginsData} title={chartConfigs.margins.title} yAxisFormat={chartConfigs.margins.yAxisFormat} yAxisLabel={chartConfigs.margins.yAxisLabel} />
                </div>
              ) : !loading && (<p>Keine Margen-Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.eps.title, () => onExpandChart(epsData, chartConfigs.eps), 'eps')}
            </IonCardHeader>
            <IonCardContent>
              {epsData?.labels?.length > 0 && epsData.datasets[0]?.values?.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={epsData} title={chartConfigs.eps.title} yAxisFormat={chartConfigs.eps.yAxisFormat} yAxisLabel={chartConfigs.eps.yAxisLabel} />
                </div>
              ) : !loading && (<p>Keine EPS Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>

      {/* Row 3 */}
       <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.shares.title, () => onExpandChart(sharesData, chartConfigs.shares), 'shares')}
            </IonCardHeader>
            <IonCardContent>
              {sharesData?.labels?.length > 0 && sharesData.datasets[0]?.values?.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={sharesData} title={chartConfigs.shares.title} yAxisFormat={chartConfigs.shares.yAxisFormat} yAxisLabel={chartConfigs.shares.yAxisLabel} />
                </div>
               ) : !loading && ( <p>Keine Daten zu ausstehenden Aktien verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.debtToEquity.title, () => onExpandChart(debtToEquityData, chartConfigs.debtToEquity), 'debtToEquity')}
            </IonCardHeader>
            <IonCardContent>
              {debtToEquityData?.labels?.length > 0 && debtToEquityData.datasets[0]?.values?.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={debtToEquityData} title={chartConfigs.debtToEquity.title} yAxisFormat={chartConfigs.debtToEquity.yAxisFormat} yAxisLabel={chartConfigs.debtToEquity.yAxisLabel} />
                </div>
               ) : !loading && ( <p>Keine Debt-to-Equity Daten verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>

      {/* Row 4 für Dividenden-Charts */}
      {(paysDividends || canShowDps) && (
        <IonRow>
          {paysDividends ? (
            <IonCol size="12" size-lg="6">
              <IonCard className="chart-grid-card">
                <IonCardHeader>
                  {renderHeaderContent(chartConfigs.totalDividends.title, () => onExpandChart(totalDividendsData, chartConfigs.totalDividends), 'totalDividends')}
                </IonCardHeader>
                <IonCardContent>
                  {canShowTotalDividends ? (
                    <div className="chart-wrapper-div">
                      <BarChart data={totalDividendsData} title={chartConfigs.totalDividends.title} yAxisFormat={chartConfigs.totalDividends.yAxisFormat} yAxisLabel={chartConfigs.totalDividends.yAxisLabel} />
                    </div>
                  ) : !loading && (<p>Keine Daten zu Dividendenzahlungen verfügbar.</p>)}
                </IonCardContent>
              </IonCard>
            </IonCol>
          ) : ( canShowDps && <IonCol size="12" size-lg="6"></IonCol> )} {/* Leere Spalte als Platzhalter, falls nur DPS angezeigt wird */}

          {canShowDps ? (
            <IonCol size="12" size-lg="6">
              <IonCard className="chart-grid-card">
                <IonCardHeader>
                  {renderHeaderContent(chartConfigs.dps.title, () => onExpandChart(dpsData, chartConfigs.dps), 'dps')}
                </IonCardHeader>
                <IonCardContent>
                   <div className="chart-wrapper-div">
                     <BarChart data={dpsData} title={chartConfigs.dps.title} yAxisFormat={chartConfigs.dps.yAxisFormat} yAxisLabel={chartConfigs.dps.yAxisLabel} />
                   </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ) : ( paysDividends && !loading ? ( 
            <IonCol size="12" size-lg="6"> 
              <IonCard className="chart-grid-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}> {/* Angepasst für bessere vertikale Zentrierung des Textes */}
                <IonCardContent>
                  <p>Keine historischen Dividenden-pro-Aktie Daten verfügbar.</p>
                </IonCardContent>
              </IonCard> 
            </IonCol> 
            ) : ( !paysDividends && <IonCol size="12" size-lg="6"></IonCol> ) /* Leere Spalte als Platzhalter */
          )}
        </IonRow>
      )}
    </IonGrid>
  );
};

export default ChartGrid;