// src/utils/stockDataProcessing.ts (Bereinigte Version)
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  RawApiData,
} from '../types/stockDataTypes';
import { formatQuarter, trimMultiData } from './utils';

// --- Interne Hilfsfunktionen ---

const parseAndScale = (value: string | undefined | null): number => {
  if (value === undefined || value === null || value === "None" || value === "-") return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num / 1e9; // Skaliert auf Mrd.
};

const parseFloatOrZero = (value: string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const trimData = (labels: (string | number)[], values: number[]): StockData => {
  if (!Array.isArray(labels) || !Array.isArray(values)) {
    return { labels: [], values: [] };
  }
  const firstValidIndex = values.findIndex(value => value !== 0 && value !== null && value !== undefined);
  if (firstValidIndex === -1 || values.length === 0 || labels.length === 0 || labels.length !== values.length) {
    return { labels: [], values: [] };
  }
  return { labels: labels.slice(firstValidIndex), values: values.slice(firstValidIndex) };
};

const calculateMargins = (report: any): { gm: number | null, om: number | null, nm: number | null } => {
  if (!report || typeof report !== 'object') {
    // Optional: console.warn("calculateMargins received invalid report:", report);
    return { gm: null, om: null, nm: null };
  }
  const revenue = parseFloat(report.totalRevenue);
  if (isNaN(revenue) || revenue === 0) {
    return { gm: null, om: null, nm: null };
  }
  const gp = parseFloat(report.grossProfit);
  const oi = parseFloat(report.operatingIncome);
  const ni = parseFloat(report.netIncome);
  return {
    gm: isNaN(gp) ? null : (gp / revenue) * 100,
    om: isNaN(oi) ? null : (oi / revenue) * 100,
    nm: isNaN(ni) ? null : (ni / revenue) * 100,
  };
};

// --- Verarbeitungsfunktionen für spezifische API-Daten ---

const processIncomeData = (incomeData: any): {
  annualRevenue: StockData;
  quarterlyRevenue: StockData;
  annualIncomeStatement: MultiDatasetStockData;
  quarterlyIncomeStatement: MultiDatasetStockData;
  annualMargins: MultiDatasetStockData;
  quarterlyMargins: MultiDatasetStockData;
  latestAnnualGrossMargin: number | null;
  latestAnnualOperatingMargin: number | null;
} => {
  let result = {
    annualRevenue: { labels: [], values: [] } as StockData,
    quarterlyRevenue: { labels: [], values: [] } as StockData,
    annualIncomeStatement: { labels: [], datasets: [] } as MultiDatasetStockData,
    quarterlyIncomeStatement: { labels: [], datasets: [] } as MultiDatasetStockData,
    annualMargins: { labels: [], datasets: [] } as MultiDatasetStockData,
    quarterlyMargins: { labels: [], datasets: [] } as MultiDatasetStockData,
    latestAnnualGrossMargin: null as number | null,
    latestAnnualOperatingMargin: null as number | null,
  };

  if (!incomeData || (!incomeData.annualReports && !incomeData.quarterlyReports)) {
    return result;
  }

  // Jahresdaten
  const annualReports = (Array.isArray(incomeData.annualReports) ? incomeData.annualReports : [])
    .sort((a: any, b: any) => parseInt(a.fiscalDateEnding.substring(0, 4)) - parseInt(b.fiscalDateEnding.substring(0, 4)));

  if (annualReports.length > 0) {
    const annualLabelsInc = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
    const annualMarginsData = annualReports.map(calculateMargins);

    result.annualIncomeStatement = {
      labels: annualLabelsInc,
      datasets: [
        { label: 'Revenue', values: annualReports.map((r: any) => parseAndScale(r.totalRevenue)) },
        { label: 'Gross Profit', values: annualReports.map((r: any) => parseAndScale(r.grossProfit)) },
        { label: 'Operating Income', values: annualReports.map((r: any) => parseAndScale(r.operatingIncome)) },
        { label: 'Net Income', values: annualReports.map((r: any) => parseAndScale(r.netIncome)) },
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

  // Quartalsdaten
  const quarterlyReports = (Array.isArray(incomeData.quarterlyReports) ? incomeData.quarterlyReports : [])
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());

  if (quarterlyReports.length > 0) {
    const quarterlyLabelsInc = quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
    const quarterlyMarginsData = quarterlyReports.map(calculateMargins);

    result.quarterlyIncomeStatement = {
      labels: quarterlyLabelsInc,
      datasets: [
        { label: 'Revenue', values: quarterlyReports.map((r: any) => parseAndScale(r.totalRevenue)) },
        { label: 'Gross Profit', values: quarterlyReports.map((r: any) => parseAndScale(r.grossProfit)) },
        { label: 'Operating Income', values: quarterlyReports.map((r: any) => parseAndScale(r.operatingIncome)) },
        { label: 'Net Income', values: quarterlyReports.map((r: any) => parseAndScale(r.netIncome)) },
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

const processEarningsData = (earningsData: any): {
  annualEPS: StockData;
  quarterlyEPS: StockData;
} => {
  let result = {
    annualEPS: { labels: [], values: [] } as StockData,
    quarterlyEPS: { labels: [], values: [] } as StockData,
  };

  if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
    return result;
  }

  // Jahresdaten
  const annualEarnings = (Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [])
    .sort((a: any, b: any) => parseInt(a.fiscalDateEnding.substring(0, 4)) - parseInt(b.fiscalDateEnding.substring(0, 4)));
  if (annualEarnings.length > 0) {
    const annualLabelsEPS = annualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));
    const annualValuesEPS = annualEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
    result.annualEPS = trimData(annualLabelsEPS, annualValuesEPS);
  }

  // Quartalsdaten
  const quarterlyEarnings = (Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [])
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  if (quarterlyEarnings.length > 0) {
    const quarterlyLabelsEPS = quarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));
    const quarterlyValuesEPS = quarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
    result.quarterlyEPS = trimData(quarterlyLabelsEPS, quarterlyValuesEPS);
  }

  return result;
};

const processCashflowData = (cashFlowData: any): {
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;
} => {
  let result = {
    annualCashflowStatement: { labels: [], datasets: [] } as MultiDatasetStockData,
    quarterlyCashflowStatement: { labels: [], datasets: [] } as MultiDatasetStockData,
  };

  if (!cashFlowData || (!cashFlowData.annualReports && !cashFlowData.quarterlyReports)) {
    return result;
  }

  // Jahresdaten
  const annualCashFlowReports = (Array.isArray(cashFlowData.annualReports) ? cashFlowData.annualReports : [])
    .sort((a: any, b: any) => parseInt(a.fiscalDateEnding.substring(0, 4)) - parseInt(b.fiscalDateEnding.substring(0, 4)));

  if (annualCashFlowReports.length > 0) {
    const annualLabels = annualCashFlowReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
    const annualOCF = annualCashFlowReports.map(r => parseAndScale(r.operatingCashflow));
    const annualCapEx = annualCashFlowReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures))); // Positiv!
    const annualFCFValues = annualCashFlowReports.map(r => {
      const ocf = parseFloatOrZero(r.operatingCashflow);
      const capex = parseFloatOrZero(r.capitalExpenditures);
      return (ocf - Math.abs(capex)) / 1e9; // Skaliert auf Mrd.
    });

    result.annualCashflowStatement = trimMultiData({
      labels: annualLabels,
      datasets: [
        { label: 'Operating Cash Flow', values: annualOCF },
        { label: 'Capital Expenditure', values: annualCapEx },
        { label: 'Free Cash Flow', values: annualFCFValues }
      ]
    });
  }

  // Quartalsdaten
  const quarterlyCashFlowReports = (Array.isArray(cashFlowData.quarterlyReports) ? cashFlowData.quarterlyReports : [])
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());

  if (quarterlyCashFlowReports.length > 0) {
    const quarterlyLabels = quarterlyCashFlowReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
    const quarterlyOCF = quarterlyCashFlowReports.map(r => parseAndScale(r.operatingCashflow));
    const quarterlyCapEx = quarterlyCashFlowReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures))); // Positiv!
    const quarterlyFCFValues = quarterlyCashFlowReports.map(r => {
      const ocf = parseFloatOrZero(r.operatingCashflow);
      const capex = parseFloatOrZero(r.capitalExpenditures);
      return (ocf - Math.abs(capex)) / 1e9; // Skaliert auf Mrd.
    });

    result.quarterlyCashflowStatement = trimMultiData({
      labels: quarterlyLabels,
      datasets: [
        { label: 'Operating Cash Flow', values: quarterlyOCF },
        { label: 'Capital Expenditure', values: quarterlyCapEx },
        { label: 'Free Cash Flow', values: quarterlyFCFValues }
      ]
    });
  }

  return result;
};

const processBalanceSheetData = (balanceSheetData: any): {
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;
} => {
  let result = {
    annualSharesOutstanding: { labels: [], values: [] } as StockData,
    quarterlySharesOutstanding: { labels: [], values: [] } as StockData,
  };

  if (!balanceSheetData || (!balanceSheetData.annualReports && !balanceSheetData.quarterlyReports)) {
    return result;
  }

  // Helper zum Parsen und Skalieren der Aktienanzahl (auf Millionen)
  const parseAndScaleShares = (value: string | undefined | null): number => {
    if (value === undefined || value === null || value === "None" || value === "-") return 0;
    const num = parseFloat(value);
    // Teile durch 1 Million für die Anzeige in Millionen
    return isNaN(num) ? 0 : num / 1e6;
  };

  // Jahresdaten
  const annualReports = (Array.isArray(balanceSheetData.annualReports) ? balanceSheetData.annualReports : [])
    .sort((a: any, b: any) => parseInt(a.fiscalDateEnding.substring(0, 4)) - parseInt(b.fiscalDateEnding.substring(0, 4)));

  if (annualReports.length > 0) {
    const annualLabels = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
    // API Feld: 'commonStockSharesOutstanding' (prüfe ggf. die genaue API Antwort)
    const annualValues = annualReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
    result.annualSharesOutstanding = trimData(annualLabels, annualValues);
  }

  // Quartalsdaten
  const quarterlyReports = (Array.isArray(balanceSheetData.quarterlyReports) ? balanceSheetData.quarterlyReports : [])
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());

  if (quarterlyReports.length > 0) {
    const quarterlyLabels = quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
    // API Feld: 'commonStockSharesOutstanding'
    const quarterlyValues = quarterlyReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
    result.quarterlySharesOutstanding = trimData(quarterlyLabels, quarterlyValues);
  }

  return result;
};

// --- Hilfsfunktionen für KeyMetrics Formatierung ---
const formatMetric = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value);
    const num = parseFloat(stringValue);
    return isNaN(num) ? null : stringValue;
};
const formatPercentage = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value).includes('%') ? String(value).replace('%', '') : String(value);
    const numValue = parseFloat(stringValue);
    if (isNaN(numValue)) return null;
    if (String(value).includes('%')) {
        return `${numValue.toFixed(2)}%`;
    } else if (Math.abs(numValue) > 0 && Math.abs(numValue) <= 1) {
        return `${(numValue * 100).toFixed(2)}%`;
    } else {
        return `${numValue.toFixed(2)}%`;
    }
};
const formatPriceChange = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num.toFixed(2);
};
const formatMarginForDisplay = (value: number | null): string | null => {
    if (value === null || isNaN(value) || !isFinite(value)) return null;
    return `${value.toFixed(2)}%`;
};


// --- Hauptfunktion zur Verarbeitung aller Rohdaten ---
export const processStockData = (rawData: RawApiData, ticker: string): {
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null;
  annualRevenue: StockData;
  quarterlyRevenue: StockData;
  annualEPS: StockData;
  quarterlyEPS: StockData;
  annualIncomeStatement: MultiDatasetStockData;
  quarterlyIncomeStatement: MultiDatasetStockData;
  annualMargins: MultiDatasetStockData;
  quarterlyMargins: MultiDatasetStockData;
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;
} => {
  // Destructure jetzt auch balanceSheet
  const { income, earnings, cashflow, overview, quote, balanceSheet } = rawData;

  // Grundlegende Fehlerprüfung
  if (!overview?.Symbol) {
    console.error("Processing Error: Overview data or Symbol missing!", overview);
    throw new Error(`Keine Unternehmensinformationen (OVERVIEW) für Ticker "${ticker}" verfügbar.`);
  }
  const globalQuote = quote?.['Global Quote'];
  if (!globalQuote) {
     console.warn(`Keine Global Quote Daten für Ticker "${ticker}" verfügbar. Quote data:`, quote);
  }

  const hasIncomeData = !!(income?.annualReports || income?.quarterlyReports);
  const hasEarningsData = !!(earnings?.annualEarnings || earnings?.quarterlyEarnings);
  const hasCashflowData = !!(cashflow?.annualReports || cashflow?.quarterlyReports);
  const hasBalanceSheetData = !!(balanceSheet?.annualReports || balanceSheet?.quarterlyReports);

  if (!hasIncomeData && !hasEarningsData && !hasCashflowData && !hasBalanceSheetData) {
    console.warn(`Für Ticker "${ticker}" fehlen möglicherweise einige Finanzdaten.`);
    // Optional: Fehler werfen, wenn GAR NICHTS da ist
    // throw new Error(`Keine Finanzdaten (Income, Earnings, Cashflow, BalanceSheet) für Ticker "${ticker}" verfügbar.`);
  }

  // --- Datenverarbeitung ---
  const incomeProcessed = processIncomeData(income);
  const earningsProcessed = processEarningsData(earnings);
  const cashflowProcessed = processCashflowData(cashflow);
  const balanceSheetProcessed = processBalanceSheetData(balanceSheet);

  // --- Company Info ---
  const currentPrice = globalQuote?.['05. price'];
  const companyInfo: CompanyInfo = {
     Name: overview?.Name || ticker,
     Industry: overview?.Industry || 'N/A',
     Address: overview?.Address || 'N/A',
     MarketCapitalization: overview?.MarketCapitalization || 'N/A',
     LastSale: currentPrice ? parseFloat(currentPrice).toFixed(2) : 'N/A',
  };

  // --- Key Metrics ---
  const rawChange = globalQuote?.['09. change'];
  const rawChangePercent = globalQuote?.['10. change percent'];
  const numChange = parseFloat(rawChange || '');
  const keyMetrics: KeyMetrics = {
      peRatio: formatMetric(overview?.PERatio),
      psRatio: formatMetric(overview?.PriceToSalesRatioTTM),
      pbRatio: formatMetric(overview?.PriceToBookRatio),
      evToEbitda: formatMetric(overview?.EVToEBITDA),
      dividendYield: formatPercentage(overview?.DividendYield),
      priceChange: formatPriceChange(rawChange),
      priceChangePercent: formatPercentage(rawChangePercent),
      isPositiveChange: !isNaN(numChange) && numChange >= 0,
      grossMargin: formatMarginForDisplay(incomeProcessed.latestAnnualGrossMargin),
      operatingMargin: formatMarginForDisplay(incomeProcessed.latestAnnualOperatingMargin),
   };

  // --- Rückgabe aller verarbeiteten Daten ---
  return {
    companyInfo,
    keyMetrics,
    annualRevenue: incomeProcessed.annualRevenue,
    quarterlyRevenue: incomeProcessed.quarterlyRevenue,
    annualEPS: earningsProcessed.annualEPS,
    quarterlyEPS: earningsProcessed.quarterlyEPS,
    annualIncomeStatement: incomeProcessed.annualIncomeStatement,
    quarterlyIncomeStatement: incomeProcessed.quarterlyIncomeStatement,
    annualMargins: incomeProcessed.annualMargins,
    quarterlyMargins: incomeProcessed.quarterlyMargins,
    annualCashflowStatement: cashflowProcessed.annualCashflowStatement,
    quarterlyCashflowStatement: cashflowProcessed.quarterlyCashflowStatement,
    annualSharesOutstanding: balanceSheetProcessed.annualSharesOutstanding,
    quarterlySharesOutstanding: balanceSheetProcessed.quarterlySharesOutstanding,
  };
};

// --- Ende stockDataProcessing.ts ---