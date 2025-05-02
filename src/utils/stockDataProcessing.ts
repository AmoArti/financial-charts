// src/utils/stockDataProcessing.ts (Refactored - V3: Income, Earnings, Cashflow ausgelagert)
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  RawApiData,
  UseStockDataResult // Behalte den vollen Typ für den Rückgabewert
} from '../types/stockDataTypes';
// Importiere allgemeine Helfer
import { formatQuarter, trimMultiData, parseAndScale, parseFloatOrZero, trimData } from '../utils/utils';
// Importiere ausgelagerte Verarbeitungsfunktionen
import { processIncomeData } from './processing/incomeProcessing';
import { processEarningsData } from './processing/earningsProcessing';
import { processCashflowData } from './processing/cashflowProcessing';

// --- Verarbeitungsfunktion für Balance Sheet (bleibt vorerst hier) ---

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
    .sort((a: any, b: any) => {
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearA - yearB;
    });
  if (annualReports.length > 0) {
      const validAnnualReports = annualReports.filter((r:any) => r?.fiscalDateEnding && r?.commonStockSharesOutstanding);
      const annualLabels = validAnnualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
      const annualValues = validAnnualReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
      result.annualSharesOutstanding = trimData(annualLabels, annualValues); // Nutzt trimData aus utils
  }

  // Quartalsdaten
  const quarterlyReports = (Array.isArray(balanceSheetData.quarterlyReports) ? balanceSheetData.quarterlyReports : [])
    .sort((a: any, b: any) => {
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });
  if (quarterlyReports.length > 0) {
      const validQuarterlyReports = quarterlyReports.filter((r:any) => r?.fiscalDateEnding && r?.commonStockSharesOutstanding);
      const quarterlyLabels = validQuarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding)); // Nutzt formatQuarter aus utils
      const quarterlyValues = validQuarterlyReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
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
        // Assume decimal yield needs multiplying
        return `${(numValue * 100).toFixed(2)}%`;
    } else {
         // Assume it's already a percentage value (like margin) or needs formatting as such
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
// Definiere den Rückgabetyp basierend auf UseStockDataResult ohne die Hook-Metadaten
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
  }

  // --- Datenverarbeitung ---
  // Rufe die importierten Funktionen auf
  const incomeProcessed = processIncomeData(income);
  const earningsProcessed = processEarningsData(earnings);
  const cashflowProcessed = processCashflowData(cashflow); // Importierte Funktion
  const balanceSheetProcessed = processBalanceSheetData(balanceSheet); // Lokale Funktion (noch)

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