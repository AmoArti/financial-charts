// src/types/stockDataTypes.ts (Angepasst für DIVIDENDS Endpoint)

// Basis-Struktur für einfache Chart-Daten (Labels + Werte)
export interface StockData {
  labels: (string | number)[];
  values: number[];
}

// Struktur für Daten mit mehreren Datensätzen (z.B. Income Statement)
export interface MultiDatasetStockData {
  labels: (string | number)[];
  datasets: {
    label: string;
    values: number[];
    backgroundColor?: string; // Optional für spätere Verwendung
    borderColor?: string; // Optional für spätere Verwendung
  }[];
}

// Unternehmensinformationen
export interface CompanyInfo {
  Name: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string;
  LastSale: string;
}

// Kennzahlen
export interface KeyMetrics {
  peRatio: string | null;
  psRatio: string | null;
  pbRatio: string | null;
  evToEbitda: string | null;
  dividendYield: string | null;
  priceChange: string | null;
  priceChangePercent: string | null;
  isPositiveChange: boolean;
  grossMargin: string | null;
  operatingMargin: string | null;
}

// Rückgabe-Typ des useStockData Hooks
export interface UseStockDataResult {
  // Umsatzdaten
  annualRevenue: StockData;
  quarterlyRevenue: StockData;

  // EPS Daten (aus Earnings)
  annualEPS: StockData;
  quarterlyEPS: StockData;

  // Dividend Per Share Daten (aus Dividends History verarbeitet)
  annualDPS: StockData;
  quarterlyDPS: StockData;

  // Income Statement & Margen
  annualIncomeStatement: MultiDatasetStockData;
  quarterlyIncomeStatement: MultiDatasetStockData;
  annualMargins: MultiDatasetStockData;
  quarterlyMargins: MultiDatasetStockData;

  // Cashflow Statement für den Chart
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;

  // Total Dividends Paid Daten (aus Cashflow)
  annualTotalDividendsPaid: StockData;
  quarterlyTotalDividendsPaid: StockData;

  // Outstanding Shares Daten (aus Balance Sheet)
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;

  // Debt-to-Equity Ratio Daten (aus Balance Sheet)
  annualDebtToEquity: StockData;
  quarterlyDebtToEquity: StockData;

  // Flag, ob Dividenden gezahlt werden (aus Overview)
  paysDividends: boolean;

  // Metadaten & Funktion
  loading: boolean;
  error: string | null;
  progress: number;
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null;
  fetchData: (ticker: string) => void;
}


// Typ für die Rohdaten, wie sie von der API (nach json()) kommen könnten
// (Verbesserungswürdig - spezifische Typen statt 'any' wären besser)
export interface RawApiData {
  income?: any;
  earnings?: any; // Enthält Rohdaten für EPS
  cashflow?: any; // Enthält Rohdaten für Total Dividends Paid
  overview?: any; // Enthält Rohdaten für CompanyInfo, KeyMetrics, paysDividends Flag
  quote?: any;    // Enthält Rohdaten für CompanyInfo, KeyMetrics
  balanceSheet?: any; // Enthält Rohdaten für Shares Outstanding, D/E Ratio
  dividends?: any; // NEU: Enthält Rohdaten für DPS (Liste einzelner Zahlungen)
}

// --- Ende src/types/stockDataTypes.ts ---