// src/utils/stockDataProcessing.ts
import {
  CompanyInfo,
  KeyMetrics,
  RawApiData,
  UseStockDataResult,
  BalanceSheetMetrics,
} from '../types/stockDataTypes';
import { parseFloatOrZero } from '../utils/utils';
import { processIncomeData } from './processing/incomeProcessing';
import { processEarningsData } from './processing/earningsProcessing';
import { processCashflowData } from './processing/cashflowProcessing';
import { processBalanceSheetData } from './processing/balanceSheetProcessing';
import { processDividendHistory } from './processing/dividendProcessing';

// --- Hilfsfunktionen NUR für KeyMetrics Formatierung ---
const formatMetric = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value);
    const num = parseFloat(stringValue);
    return isNaN(num) ? null : stringValue;
};

// --- KORRIGIERTE FUNKTION ---
const formatPercentage = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;

    const originalValueString = String(value);
    // Prüfe, ob der Wert bereits ein Prozent-String ist (wie bei "change percent")
    const isAlreadyPercent = originalValueString.includes('%');
    
    const stringValue = originalValueString.replace('%', '');
    const numValue = parseFloat(stringValue);

    if (isNaN(numValue)) return null;

    // Wenn der Wert von der API bereits ein Prozentwert war (z.B. "0.75%"),
    // dann formatiere ihn nur neu, aber multipliziere nicht mit 100.
    if (isAlreadyPercent) {
        return `${numValue.toFixed(2)}%`;
    }

    // Wenn der Wert eine Dezimalzahl ist (wie bei DividendYield oder FCF Yield),
    // dann multipliziere mit 100, um einen Prozentwert zu erhalten.
    return `${(numValue * 100).toFixed(2)}%`;
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
type ProcessedStockDataResult = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const processStockData = (rawData: RawApiData, ticker: string): ProcessedStockDataResult => {
  const { income, earnings, cashflow, overview, quote, balanceSheet, dividends } = rawData;

  if (!overview?.Symbol) throw new Error(`Keine Unternehmensinformationen (OVERVIEW) für Ticker "${ticker}" verfügbar.`);
  const globalQuote = quote?.['Global Quote'];
  if (!globalQuote) console.warn(`Keine Global Quote Daten für Ticker "${ticker}" verfügbar.`);

  // --- Datenverarbeitung durch Aufruf der importierten Funktionen ---
  const incomeProcessed = processIncomeData(income);
  const earningsProcessed = processEarningsData(earnings);
  const cashflowProcessed = processCashflowData(cashflow);
  const balanceSheetProcessed = processBalanceSheetData(balanceSheet);
  const dividendProcessed = processDividendHistory(dividends);

  const sortedQuarterlyEarnings = [...(earnings?.quarterlyEarnings || [])].sort((a, b) => {
    const dateA = a.reportedDate ? new Date(a.reportedDate).getTime() : 0;
    const dateB = b.reportedDate ? new Date(b.reportedDate).getTime() : 0;
    return dateB - dateA;
  });
  
  const now = new Date().getTime();
  let nextEarningsDate = sortedQuarterlyEarnings[0]?.reportedDate || null;
  const futureEarning = sortedQuarterlyEarnings.reverse().find(e => e.reportedDate && new Date(e.reportedDate).getTime() > now);
  
  if (futureEarning) {
    nextEarningsDate = futureEarning.reportedDate;
  }
  
  // --- Company Info ---
  const currentPrice = globalQuote?.['05. price'];
  const companyInfo: CompanyInfo = {
     Name: overview?.Name || ticker,
     Industry: overview?.Industry || 'N/A',
     Address: overview?.Address || 'N/A',
     MarketCapitalization: overview?.MarketCapitalization || 'N/A',
     LastSale: currentPrice ? parseFloat(currentPrice).toFixed(2) : 'N/A',
     EarningsDate: nextEarningsDate,
  };

  // --- Berechnung für FCF Yield ---
  const lastAnnualReportCF = cashflow?.annualReports?.[cashflow.annualReports.length - 1];
  const fcf = parseFloatOrZero(lastAnnualReportCF?.operatingCashflow) - Math.abs(parseFloatOrZero(lastAnnualReportCF?.capitalExpenditures));
  const marketCap = parseFloatOrZero(overview.MarketCapitalization);
  const fcfYield = marketCap > 0 ? (fcf / marketCap) : null;

  // --- Key Metrics ---
  const rawChange = globalQuote?.['09. change'];
  const rawChangePercent = globalQuote?.['10. change percent'];
  const numChange = parseFloat(rawChange || '');
  const keyMetrics: KeyMetrics = {
      peRatio: formatMetric(overview?.PERatio),
      psRatio: formatMetric(overview?.PriceToSalesRatioTTM),
      pbRatio: formatMetric(overview?.PriceToBookRatio),
      evToEbitda: formatMetric(overview?.EVToEBITDA),
      dividendYield: formatPercentage(overview?.DividendYield), // Wird zu: "0.50%"
      priceChange: formatPriceChange(rawChange),
      priceChangePercent: formatPercentage(rawChangePercent), // Wird jetzt korrekt behandelt: "0.75%"
      isPositiveChange: !isNaN(numChange) && numChange >= 0,
      grossMargin: formatMarginForDisplay(incomeProcessed.latestAnnualGrossMargin),
      operatingMargin: formatMarginForDisplay(incomeProcessed.latestAnnualOperatingMargin),
      payoutRatio: formatPercentage(overview?.PayoutRatio),
      payoutDate: overview?.DividendDate || 'N/A',
      freeCashFlowYield: formatPercentage(fcfYield),
   };

   const paysDividends = (parseFloatOrZero(overview?.DividendYield) > 0 || parseFloatOrZero(overview?.DividendPerShare) > 0);

  return {
    companyInfo,
    keyMetrics,
    paysDividends,
    balanceSheetMetrics: balanceSheetProcessed.latestBalanceSheetMetrics,
    annualRevenue: incomeProcessed.annualRevenue,
    quarterlyRevenue: incomeProcessed.quarterlyRevenue,
    annualIncomeStatement: incomeProcessed.annualIncomeStatement,
    quarterlyIncomeStatement: incomeProcessed.quarterlyIncomeStatement,
    annualMargins: incomeProcessed.annualMargins,
    quarterlyMargins: incomeProcessed.quarterlyMargins,
    annualEPS: earningsProcessed.annualEPS,
    quarterlyEPS: earningsProcessed.quarterlyEPS,
    annualCashflowStatement: cashflowProcessed.annualCashflowStatement,
    quarterlyCashflowStatement: cashflowProcessed.quarterlyCashflowStatement,
    annualTotalDividendsPaid: cashflowProcessed.annualTotalDividendsPaid,
    quarterlyTotalDividendsPaid: cashflowProcessed.quarterlyTotalDividendsPaid,
    annualSharesOutstanding: balanceSheetProcessed.annualSharesOutstanding,
    quarterlySharesOutstanding: balanceSheetProcessed.quarterlySharesOutstanding,
    annualDebtToEquity: balanceSheetProcessed.annualDebtToEquity,
    quarterlyDebtToEquity: balanceSheetProcessed.quarterlyDebtToEquity,
    annualDPS: dividendProcessed.annualDPS,
    quarterlyDPS: dividendProcessed.quarterlyDPS,
  };
};