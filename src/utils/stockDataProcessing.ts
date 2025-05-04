// src/utils/stockDataProcessing.ts (Angepasst für paysDividends Flag & Total Dividends - Vollständig)
import {
  StockData, // Wird für Typ-Definition unten gebraucht
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  RawApiData,
  UseStockDataResult // Importiere den (bald) aktualisierten Typ
} from '../types/stockDataTypes';
// Importiere allgemeine Helfer
import { formatQuarter, trimMultiData, parseAndScale, parseFloatOrZero, trimData } from '../utils/utils';
// Importiere ausgelagerte Verarbeitungsfunktionen
import { processIncomeData } from './processing/incomeProcessing';
import { processEarningsData } from './processing/earningsProcessing';
import { processCashflowData } from './processing/cashflowProcessing'; // Gibt jetzt Total Dividends mit zurück
import { processBalanceSheetData } from './processing/balanceSheetProcessing';

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
// Definiere den Rückgabetyp basierend auf dem (bald) aktualisierten UseStockDataResult
// Füge paysDividends hinzu
type ProcessedStockDataResult = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

// Die Funktion Signatur muss den aktualisierten Typ widerspiegeln
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

  // --- Datenverarbeitung ---
  const incomeProcessed = processIncomeData(income);
  const earningsProcessed = processEarningsData(earnings);
  const cashflowProcessed = processCashflowData(cashflow); // Enthält jetzt Total Dividends Paid
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

  // --- NEU: Prüfen, ob Dividenden gezahlt werden ---
  // Prüft ob DividendYield ODER DividendPerShare einen positiven Wert haben
  const paysDividends = (parseFloatOrZero(overview?.DividendYield) > 0 || parseFloatOrZero(overview?.DividendPerShare) > 0);


  // --- Rückgabe aller verarbeiteten Daten ---
  // Füge paysDividends und TotalDividendsPaid hinzu
  return {
    companyInfo,
    keyMetrics,
    paysDividends, // NEU
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
    annualTotalDividendsPaid: cashflowProcessed.annualTotalDividendsPaid, // NEU
    quarterlyTotalDividendsPaid: cashflowProcessed.quarterlyTotalDividendsPaid, // NEU
    annualSharesOutstanding: balanceSheetProcessed.annualSharesOutstanding,
    quarterlySharesOutstanding: balanceSheetProcessed.quarterlySharesOutstanding,
    annualDebtToEquity: balanceSheetProcessed.annualDebtToEquity,
    quarterlyDebtToEquity: balanceSheetProcessed.quarterlyDebtToEquity,
  };
};

// --- Ende stockDataProcessing.ts ---