// src/utils/stockDataProcessing.ts (Refactored - V1: processIncomeData ausgelagert)
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  RawApiData,
} from '../types/stockDataTypes';
// Importiere ausgelagerte Funktion und allgemeine Helfer
import { formatQuarter, trimMultiData, parseAndScale, parseFloatOrZero, trimData } from '../utils/utils'; // Angepasste Imports
import { processIncomeData } from './processing/incomeProcessing'; // NEUER Import

// --- Interne Hilfsfunktionen ---
// calculateMargins wurde nach incomeProcessing.ts verschoben
// parseAndScale wurde nach utils.ts verschoben
// parseFloatOrZero wurde nach utils.ts verschoben
// trimData wurde nach utils.ts verschoben

// --- Verarbeitungsfunktionen für spezifische API-Daten (Earnings, CF, Balance Sheet) ---

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
    result.annualEPS = trimData(annualLabelsEPS, annualValuesEPS); // Nutzt trimData aus utils
  }

  // Quartalsdaten
  const quarterlyEarnings = (Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [])
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  if (quarterlyEarnings.length > 0) {
    const quarterlyLabelsEPS = quarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding)); // Nutzt formatQuarter aus utils
    const quarterlyValuesEPS = quarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
    result.quarterlyEPS = trimData(quarterlyLabelsEPS, quarterlyValuesEPS); // Nutzt trimData aus utils
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
    // Nutze Helfer aus utils
    const annualOCF = annualCashFlowReports.map(r => parseAndScale(r.operatingCashflow));
    const annualCapEx = annualCashFlowReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures)));
    const annualFCFValues = annualCashFlowReports.map(r => {
      const ocf = parseFloatOrZero(r.operatingCashflow);
      const capex = parseFloatOrZero(r.capitalExpenditures);
      return (ocf - Math.abs(capex)) / 1e9;
    });
    // Nutze Helfer aus utils
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
    const quarterlyLabels = quarterlyCashFlowReports.map((r: any) => formatQuarter(r.fiscalDateEnding)); // Nutzt formatQuarter aus utils
    // Nutze Helfer aus utils
    const quarterlyOCF = quarterlyCashFlowReports.map(r => parseAndScale(r.operatingCashflow));
    const quarterlyCapEx = quarterlyCashFlowReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures)));
    const quarterlyFCFValues = quarterlyCashFlowReports.map(r => {
      const ocf = parseFloatOrZero(r.operatingCashflow);
      const capex = parseFloatOrZero(r.capitalExpenditures);
      return (ocf - Math.abs(capex)) / 1e9;
    });
    // Nutze Helfer aus utils
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

  // parseAndScaleShares bleibt hier lokal, da spezifisch
  const parseAndScaleShares = (value: string | undefined | null): number => {
      if (value === undefined || value === null || value === "None" || value === "-") return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num / 1e6; // Scale to Millions
  };

  // Jahresdaten
  const annualReports = (Array.isArray(balanceSheetData.annualReports) ? balanceSheetData.annualReports : [])
    .sort((a: any, b: any) => parseInt(a.fiscalDateEnding.substring(0, 4)) - parseInt(b.fiscalDateEnding.substring(0, 4)));
  if (annualReports.length > 0) {
      const annualLabels = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
      const annualValues = annualReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
      result.annualSharesOutstanding = trimData(annualLabels, annualValues); // Nutzt trimData aus utils
  }

  // Quartalsdaten
  const quarterlyReports = (Array.isArray(balanceSheetData.quarterlyReports) ? balanceSheetData.quarterlyReports : [])
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  if (quarterlyReports.length > 0) {
      const quarterlyLabels = quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding)); // Nutzt formatQuarter aus utils
      const quarterlyValues = quarterlyReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
      result.quarterlySharesOutstanding = trimData(quarterlyLabels, quarterlyValues); // Nutzt trimData aus utils
  }

  return result;
};

// --- Hilfsfunktionen für KeyMetrics Formatierung (bleiben hier) ---
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
// Der Rückgabetyp muss mit UseStockDataResult übereinstimmen (ohne die Hook-Metadaten)
type ProcessedStockDataResult = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const processStockData = (rawData: RawApiData, ticker: string): ProcessedStockDataResult => {
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

  // Prüfen, ob überhaupt Finanzdaten vorhanden sind
  const hasIncomeData = !!(income?.annualReports || income?.quarterlyReports);
  const hasEarningsData = !!(earnings?.annualEarnings || earnings?.quarterlyEarnings);
  const hasCashflowData = !!(cashflow?.annualReports || cashflow?.quarterlyReports);
  const hasBalanceSheetData = !!(balanceSheet?.annualReports || balanceSheet?.quarterlyReports);
  if (!hasIncomeData && !hasEarningsData && !hasCashflowData && !hasBalanceSheetData) {
    console.warn(`Für Ticker "${ticker}" fehlen möglicherweise einige Finanzdaten.`);
    // Hier könnte man entscheiden, ob man einen Fehler wirft oder mit leeren Daten weitermacht
  }

  // --- Datenverarbeitung ---
  // Rufe die importierte Funktion für Income Data auf
  const incomeProcessed = processIncomeData(income); // !!! NEU: Importierte Funktion
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
      grossMargin: formatMarginForDisplay(incomeProcessed.latestAnnualGrossMargin), // Holt Marge aus incomeProcessed
      operatingMargin: formatMarginForDisplay(incomeProcessed.latestAnnualOperatingMargin), // Holt Marge aus incomeProcessed
   };

  // --- Rückgabe aller verarbeiteten Daten ---
  // Stelle sicher, dass die zurückgegebene Struktur mit UseStockDataResult übereinstimmt
  return {
    // companyInfo und keyMetrics können null sein, wenn overview fehlt, aber die Typen erlauben das
    companyInfo: companyInfo, // companyInfo ist nie null wegen der Prüfung oben, aber Typ erlaubt es
    keyMetrics: keyMetrics,   // keyMetrics ist nie null, aber Typ erlaubt es
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