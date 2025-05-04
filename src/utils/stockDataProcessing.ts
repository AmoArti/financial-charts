// src/utils/stockDataProcessing.ts (Final Refactored Version mit neuer DPS Logik)
import {
  CompanyInfo,
  KeyMetrics,
  RawApiData,
  UseStockDataResult // Importiere den finalen Typ
} from '../types/stockDataTypes';
// Importiere allgemeine Helfer (nur die hier direkt gebrauchten)
import { parseFloatOrZero } from '../utils/utils';
// Importiere ALLE ausgelagerten Verarbeitungsfunktionen
import { processIncomeData } from './processing/incomeProcessing';
import { processEarningsData } from './processing/earningsProcessing'; // Gibt nur noch EPS zurück
import { processCashflowData } from './processing/cashflowProcessing'; // Gibt CF Statement & Total Dividends zurück
import { processBalanceSheetData } from './processing/balanceSheetProcessing'; // Gibt Shares & D/E zurück
import { processDividendHistory } from './processing/dividendProcessing'; // NEU: Gibt DPS zurück

// --- Hilfsfunktionen NUR für KeyMetrics Formatierung (bleiben hier) ---
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
    } else if (Math.abs(numValue) > 0 && Math.abs(numValue) <= 1) { // Speziell für DividendYield wichtig
        return `${(numValue * 100).toFixed(2)}%`;
    } else {
        return `${numValue.toFixed(2)}%`; // Fallback
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
// Definiere den Rückgabetyp basierend auf dem finalen UseStockDataResult
type ProcessedStockDataResult = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const processStockData = (rawData: RawApiData, ticker: string): ProcessedStockDataResult => {
  // Destructure alle Rohdaten-Teile
  const { income, earnings, cashflow, overview, quote, balanceSheet, dividends } = rawData;

  // Grundlegende Fehlerprüfung
  if (!overview?.Symbol) {
    console.error("Processing Error: Overview data or Symbol missing!", overview);
    throw new Error(`Keine Unternehmensinformationen (OVERVIEW) für Ticker "${ticker}" verfügbar.`);
  }
  const globalQuote = quote?.['Global Quote'];
  if (!globalQuote) {
     console.warn(`Keine Global Quote Daten für Ticker "${ticker}" verfügbar.`);
  }

  // --- Datenverarbeitung durch Aufruf der importierten Funktionen ---
  const incomeProcessed = processIncomeData(income);
  const earningsProcessed = processEarningsData(earnings); // Enthält jetzt nur EPS
  const cashflowProcessed = processCashflowData(cashflow); // Enthält CF Statement & Total Dividends
  const balanceSheetProcessed = processBalanceSheetData(balanceSheet); // Enthält Shares & D/E
  const dividendProcessed = processDividendHistory(dividends); // NEU: Enthält DPS

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
      grossMargin: formatMarginForDisplay(incomeProcessed.latestAnnualGrossMargin), // Nutzt Ergebnis von incomeProcessed
      operatingMargin: formatMarginForDisplay(incomeProcessed.latestAnnualOperatingMargin), // Nutzt Ergebnis von incomeProcessed
   };

   // Flag für Dividenden basierend auf Overview
   const paysDividends = (parseFloatOrZero(overview?.DividendYield) > 0 || parseFloatOrZero(overview?.DividendPerShare) > 0);

  // --- Rückgabe aller verarbeiteten Daten ---
  // Kombiniere die Ergebnisse aller Verarbeitungsfunktionen + Infos/Metriken
  return {
    companyInfo,
    keyMetrics,
    paysDividends,
    // Ergebnisse aus Income Processing
    annualRevenue: incomeProcessed.annualRevenue,
    quarterlyRevenue: incomeProcessed.quarterlyRevenue,
    annualIncomeStatement: incomeProcessed.annualIncomeStatement,
    quarterlyIncomeStatement: incomeProcessed.quarterlyIncomeStatement,
    annualMargins: incomeProcessed.annualMargins,
    quarterlyMargins: incomeProcessed.quarterlyMargins,
    // Ergebnisse aus Earnings Processing
    annualEPS: earningsProcessed.annualEPS,
    quarterlyEPS: earningsProcessed.quarterlyEPS,
    // Ergebnisse aus Cashflow Processing
    annualCashflowStatement: cashflowProcessed.annualCashflowStatement,
    quarterlyCashflowStatement: cashflowProcessed.quarterlyCashflowStatement,
    annualTotalDividendsPaid: cashflowProcessed.annualTotalDividendsPaid,
    quarterlyTotalDividendsPaid: cashflowProcessed.quarterlyTotalDividendsPaid,
    // Ergebnisse aus Balance Sheet Processing
    annualSharesOutstanding: balanceSheetProcessed.annualSharesOutstanding,
    quarterlySharesOutstanding: balanceSheetProcessed.quarterlySharesOutstanding,
    annualDebtToEquity: balanceSheetProcessed.annualDebtToEquity,
    quarterlyDebtToEquity: balanceSheetProcessed.quarterlyDebtToEquity,
    // Ergebnisse aus Dividend History Processing
    annualDPS: dividendProcessed.annualDPS,
    quarterlyDPS: dividendProcessed.quarterlyDPS,
  };
};

// --- Ende stockDataProcessing.ts ---