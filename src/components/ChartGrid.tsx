// src/components/ChartGrid.tsx
import React from 'react';
import {
  IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon
} from '@ionic/react';
import { expandOutline } from 'ionicons/icons';
import BarChart from './BarChart';
import { MultiDatasetStockData } from '../types/stockDataTypes';

interface ModalChartConfig {
  title: string;
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
  chartId?: string; 
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
  onExpandChart: (chartId: string, config: ModalChartConfig) => void;
  fcfAbsData: MultiDatasetStockData;
}

const ChartGrid: React.FC<ChartGridProps> = ({
  loading, viewMode, incomeData, cashflowData, marginsData, epsData,
  sharesData, debtToEquityData, paysDividends, totalDividendsData, dpsData,
  onExpandChart,
  fcfAbsData
}) => {
  const chartViewModeLabel = viewMode === 'annual' ? 'Annual' : 'Quarterly';

  const chartConfigs = {
    income: { chartId: 'income', title: `Income Statement (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
    cashflow: { chartId: 'cashflow', title: `Cash Flow Statement (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
    margins: { chartId: 'margins', title: `Margins (${chartViewModeLabel})`, yAxisFormat: 'percent', yAxisLabel: 'Margin (%)' } as ModalChartConfig,
    eps: { chartId: 'eps', title: `EPS (${chartViewModeLabel})`, yAxisFormat: 'number', yAxisLabel: 'EPS ($)' } as ModalChartConfig,
    shares: { chartId: 'shares', title: `Outstanding Shares (${chartViewModeLabel})`, yAxisFormat: 'ratio', yAxisLabel: 'Shares (Millions)' } as ModalChartConfig,
    debtToEquity: { chartId: 'debtToEquity', title: `Debt-to-Equity Ratio (${chartViewModeLabel})`, yAxisFormat: 'ratio', yAxisLabel: 'D/E Ratio' } as ModalChartConfig,
    totalDividends: { chartId: 'totalDividends', title: `Total Dividends Paid (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
    dps: { chartId: 'dps', title: `Dividend Per Share (${chartViewModeLabel})`, yAxisFormat: 'number', yAxisLabel: 'DPS ($)' } as ModalChartConfig,
    fcf: { chartId: 'fcf', title: `Free Cash Flow (${chartViewModeLabel})`, yAxisFormat: 'currency', yAxisLabel: 'Billions ($B)' } as ModalChartConfig,
  };

  const canShowTotalDividends = paysDividends && totalDividendsData?.labels?.length > 0 && totalDividendsData.datasets[0]?.values?.length > 0;
  const canShowDps = dpsData?.labels?.length > 0 && dpsData.datasets[0]?.values?.length > 0;

  const renderHeaderContent = (title: string, onExpandClick: () => void) => (
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
    <IonGrid>
      <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
              {renderHeaderContent(chartConfigs.income.title, () => onExpandChart('income', chartConfigs.income))}
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
              {renderHeaderContent(chartConfigs.fcf.title, () => onExpandChart('fcf', chartConfigs.fcf))}
            </IonCardHeader>
            <IonCardContent>
              {fcfAbsData?.labels?.length > 0 && fcfAbsData.datasets.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={fcfAbsData} title={chartConfigs.fcf.title} yAxisFormat={chartConfigs.fcf.yAxisFormat} yAxisLabel={chartConfigs.fcf.yAxisLabel} />
                </div>
              ) : !loading && (<p>Keine Free Cash Flow Daten verfügbar.</p>)}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      
      <IonRow>
        <IonCol size="12" size-lg="6">
           <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.cashflow.title, () => onExpandChart('cashflow', chartConfigs.cashflow))}
            </IonCardHeader>
            <IonCardContent>
              {cashflowData?.labels?.length > 0 && cashflowData.datasets.length > 0 ? (
                <div className="chart-wrapper-div">
                  <BarChart data={cashflowData} title={chartConfigs.cashflow.title} yAxisFormat={chartConfigs.cashflow.yAxisFormat} yAxisLabel={chartConfigs.cashflow.yAxisLabel} />
                </div>
              ) : !loading && ( <p>Keine Cashflow Statement Daten verfügbar.</p> )}
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.margins.title, () => onExpandChart('margins', chartConfigs.margins))}
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
      </IonRow>

       <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.eps.title, () => onExpandChart('eps', chartConfigs.eps))}
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
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.shares.title, () => onExpandChart('shares', chartConfigs.shares))}
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
      </IonRow>
      <IonRow>
        <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
                {renderHeaderContent(chartConfigs.debtToEquity.title, () => onExpandChart('debtToEquity', chartConfigs.debtToEquity))}
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
        
        {/* --- KORRIGIERTER DIVIDENDEN-BLOCK --- */}
        {paysDividends && <IonCol size="12" size-lg="6">
          <IonCard className="chart-grid-card">
            <IonCardHeader>
              {renderHeaderContent(chartConfigs.totalDividends.title, () => onExpandChart('totalDividends', chartConfigs.totalDividends))}
            </IonCardHeader>
            <IonCardContent>
              {canShowTotalDividends ? <div className="chart-wrapper-div"><BarChart data={totalDividendsData} title={chartConfigs.totalDividends.title} yAxisFormat={chartConfigs.totalDividends.yAxisFormat} /></div> : !loading && <p>Keine Daten verfügbar.</p>}
            </IonCardContent>
          </IonCard>
        </IonCol>}
      </IonRow>
      
      {/* Eigene Zeile für DPS, falls es angezeigt werden kann und die obere Zeile schon voll ist oder es keine Dividenden gibt */}
      {canShowDps && (
        <IonRow>
            <IonCol size="12" size-lg="6">
                <IonCard className="chart-grid-card">
                <IonCardHeader>
                    {renderHeaderContent(chartConfigs.dps.title, () => onExpandChart('dps', chartConfigs.dps))}
                </IonCardHeader>
                <IonCardContent>
                    <div className="chart-wrapper-div"><BarChart data={dpsData} title={chartConfigs.dps.title} yAxisFormat={chartConfigs.dps.yAxisFormat} /></div>
                </IonCardContent>
                </IonCard>
            </IonCol>
        </IonRow>
      )}

    </IonGrid>
  );
};

export default ChartGrid;