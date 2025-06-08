// src/utils/processing/incomeProcessing.ts
import { StockData, MultiDatasetStockData, RawReport } from '../../types/stockDataTypes';
import { formatQuarter, parseAndScale, trimMultiData } from '../utils';

export interface ProcessedIncomeData {
  annualRevenue: StockData;
  quarterlyRevenue: StockData;
  annualIncomeStatement: MultiDatasetStockData;
  quarterlyIncomeStatement: MultiDatasetStockData;
  annualMargins: MultiDatasetStockData;
  quarterlyMargins: MultiDatasetStockData;
  latestAnnualGrossMargin: number | null;
  latestAnnualOperatingMargin: number | null;
}

const calculateMargins = (report: RawReport): { gm: number | null, om: number | null, nm: number | null } => {
  if (!report || typeof report !== 'object') return { gm: null, om: null, nm: null };
  const revenue = parseFloat(report.totalRevenue!);
  if (isNaN(revenue) || revenue === 0) return { gm: null, om: null, nm: null };
  const gp = parseFloat(report.grossProfit!);
  const oi = parseFloat(report.operatingIncome!);
  const ni = parseFloat(report.netIncome!);
  return {
    gm: isNaN(gp) ? null : (gp / revenue) * 100,
    om: isNaN(oi) ? null : (oi / revenue) * 100,
    nm: isNaN(ni) ? null : (ni / revenue) * 100,
  };
};

export const processIncomeData = (incomeData: any): ProcessedIncomeData => {
  let result: ProcessedIncomeData = {
    annualRevenue: { labels: [], values: [] },
    quarterlyRevenue: { labels: [], values: [] },
    annualIncomeStatement: { labels: [], datasets: [] },
    quarterlyIncomeStatement: { labels: [], datasets: [] },
    annualMargins: { labels: [], datasets: [] },
    quarterlyMargins: { labels: [], datasets: [] },
    latestAnnualGrossMargin: null,
    latestAnnualOperatingMargin: null,
  };

  if (!incomeData || (!incomeData.annualReports && !incomeData.quarterlyReports)) return result;

  const annualReports = (Array.isArray(incomeData.annualReports) ? incomeData.annualReports : [])
    .sort((a: RawReport, b: RawReport) => parseInt(a.fiscalDateEnding!.substring(0, 4)) - parseInt(b.fiscalDateEnding!.substring(0, 4)));

  if (annualReports.length > 0) {
    const annualLabelsInc = annualReports.map((r: RawReport) => parseInt(r.fiscalDateEnding!.substring(0, 4)));
    const annualMarginsData = annualReports.map(calculateMargins);

    result.annualIncomeStatement = {
      labels: annualLabelsInc,
      datasets: [
        { label: 'Revenue', values: annualReports.map((r: RawReport) => parseAndScale(r.totalRevenue)) },
        { label: 'Gross Profit', values: annualReports.map((r: RawReport) => parseAndScale(r.grossProfit)) },
        { label: 'Operating Income', values: annualReports.map((r: RawReport) => parseAndScale(r.operatingIncome)) },
        { label: 'Net Income', values: annualReports.map((r: RawReport) => parseAndScale(r.netIncome)) },
      ]
    };
    result.annualMargins = {
      labels: annualLabelsInc,
      datasets: [
        { label: 'Gross Margin', values: annualMarginsData.map(m => m?.gm ?? 0) },
        { label: 'Operating Margin', values: annualMarginsData.map(m => m?.om ?? 0) },
        { label: 'Net Income Margin', values: annualMarginsData.map(m => m?.nm ?? 0) }
      ]
    };
    result.annualIncomeStatement = trimMultiData(result.annualIncomeStatement);
    result.annualMargins = trimMultiData(result.annualMargins);
    result.annualRevenue = {
      labels: result.annualIncomeStatement.labels,
      values: result.annualIncomeStatement.datasets.find(ds => ds.label === 'Revenue')?.values || []
    };

    const lastAnnualMarginData = annualMarginsData[annualMarginsData.length - 1];
    result.latestAnnualGrossMargin = lastAnnualMarginData?.gm ?? null;
    result.latestAnnualOperatingMargin = lastAnnualMarginData?.om ?? null;
  }

  const quarterlyReports = (Array.isArray(incomeData.quarterlyReports) ? incomeData.quarterlyReports : [])
    .sort((a: RawReport, b: RawReport) => new Date(a.fiscalDateEnding!).getTime() - new Date(b.fiscalDateEnding!).getTime());

  if (quarterlyReports.length > 0) {
    const quarterlyLabelsInc = quarterlyReports.map((r: RawReport) => formatQuarter(r.fiscalDateEnding));
    const quarterlyMarginsData = quarterlyReports.map(calculateMargins);

    result.quarterlyIncomeStatement = {
      labels: quarterlyLabelsInc,
      datasets: [
        { label: 'Revenue', values: quarterlyReports.map((r: RawReport) => parseAndScale(r.totalRevenue)) },
        { label: 'Gross Profit', values: quarterlyReports.map((r: RawReport) => parseAndScale(r.grossProfit)) },
        { label: 'Operating Income', values: quarterlyReports.map((r: RawReport) => parseAndScale(r.operatingIncome)) },
        { label: 'Net Income', values: quarterlyReports.map((r: RawReport) => parseAndScale(r.netIncome)) },
      ]
    };
    result.quarterlyMargins = {
      labels: quarterlyLabelsInc,
      datasets: [
        { label: 'Gross Margin', values: quarterlyMarginsData.map(m => m?.gm ?? 0) },
        { label: 'Operating Margin', values: quarterlyMarginsData.map(m => m?.om ?? 0) },
        { label: 'Net Income Margin', values: quarterlyMarginsData.map(m => m?.nm ?? 0) }
      ]
    };
    result.quarterlyIncomeStatement = trimMultiData(result.quarterlyIncomeStatement);
    result.quarterlyMargins = trimMultiData(result.quarterlyMargins);
    result.quarterlyRevenue = {
       labels: result.quarterlyIncomeStatement.labels,
       values: result.quarterlyIncomeStatement.datasets.find(ds => ds.label === 'Revenue')?.values || []
    };
  }

  return result;
};