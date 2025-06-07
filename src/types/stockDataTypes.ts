// src/types/stockDataTypes.ts

// --- NEUES INTERFACE ---
// Eigene Sektion für Bilanz-Kennzahlen
export interface BalanceSheetMetrics {
  cash: string | null;
  debt: string | null;
  netDebt: string | null;
}

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
  // NEU: Earnings Date
  EarningsDate: string | null;
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
  // NEUE KENNZAHLEN
  payoutRatio: string | null;
  payoutDate: string | null;
  freeCashFlowYield: string | null;
}

// Rückgabe-Typ des useStockData Hooks
export interface UseStockDataResult {
  // Umsatzdaten
  annualRevenue: StockData;
  quarterlyRevenue: StockData;

  // EPS Daten (aus Earnings)
  annualEPS: MultiDatasetStockData;
  quarterlyEPS: MultiDatasetStockData;

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

  // --- NEUE SEKTION ---
  // Bilanz-Metriken für die Dashboard-Anzeige
  balanceSheetMetrics: BalanceSheetMetrics | null;

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

// --- Raw API Data Types ---

export interface RawOverviewData {
  Symbol?: string;
  AssetType?: string;
  Name?: string;
  Description?: string;
  CIK?: string;
  Exchange?: string;
  Currency?: string;
  Country?: string;
  Sector?: string;
  Industry?: string;
  Address?: string;
  FiscalYearEnd?: string;
  LatestQuarter?: string; // Format: "YYYY-MM-DD"
  MarketCapitalization?: string; // Kann "0" oder eine Zahl als String sein
  EBITDA?: string;
  PERatio?: string;
  PEGRatio?: string;
  BookValue?: string;
  DividendPerShare?: string;
  DividendYield?: string;
  EPS?: string;
  RevenuePerShareTTM?: string;
  ProfitMargin?: string;
  OperatingMarginTTM?: string;
  ReturnOnAssetsTTM?: string;
  ReturnOnEquityTTM?: string;
  RevenueTTM?: string;
  GrossProfitTTM?: string;
  DilutedEPSTTM?: string;
  QuarterlyEarningsGrowthYOY?: string;
  QuarterlyRevenueGrowthYOY?: string;
  AnalystTargetPrice?: string;
  AnalystRatingStrongBuy?: string;
  AnalystRatingBuy?: string;
  AnalystRatingHold?: string;
  AnalystRatingSell?: string;
  AnalystRatingStrongSell?: string;
  TrailingPE?: string;
  ForwardPE?: string;
  PriceToSalesRatioTTM?: string;
  PriceToBookRatio?: string;
  EVToRevenue?: string;
  EVToEBITDA?: string;
  Beta?: string;
  "52WeekHigh"?: string;
  "52WeekLow"?: string;
  "50DayMovingAverage"?: string;
  "200DayMovingAverage"?: string;
  SharesOutstanding?: string;
  DividendDate?: string; // Format: "YYYY-MM-DD" oder "0000-00-00"
  ExDividendDate?: string; // Format: "YYYY-MM-DD" oder "0000-00-00"
  PayoutRatio?: string; // NEU
  [key: string]: any; // Fallback für weitere, nicht explizit genannte Felder
}

// Gemeinsame Felder für Income, Cashflow, BalanceSheet Reports
export interface RawReport {
  fiscalDateEnding?: string;
  reportedCurrency?: string;
  // Income Statement spezifische Felder
  grossProfit?: string;
  totalRevenue?: string;
  operatingIncome?: string;
  netIncome?: string;
  // Cashflow spezifische Felder
  operatingCashflow?: string;
  capitalExpenditures?: string;
  dividendPayoutCommonStock?: string;
  dividendPayout?: string;
  // Balance Sheet spezifische Felder
  totalAssets?: string;
  totalLiabilities?: string;
  totalShareholderEquity?: string;
  commonStockSharesOutstanding?: string;
  cashAndCashEquivalentsAtCarryingValue?: string; // NEU
  shortTermDebt?: string; // NEU
  longTermDebtNoncurrent?: string; // NEU - Oft genauer als longTermDebt
  longTermDebt?: string; // Fallback
  [key: string]: any;
}

// ... Rest der Raw-Typen bleibt unverändert ...
export interface RawIncomeStatementData { Symbol?: string; annualReports?: RawReport[]; quarterlyReports?: RawReport[]; }
export interface RawEarningReport { fiscalDateEnding?: string; reportedDate?: string; reportedEPS?: string; estimatedEPS?: string; }
export interface RawEarningsData { symbol?: string; annualEarnings?: RawEarningReport[]; quarterlyEarnings?: RawEarningReport[]; }
export interface RawCashflowData { symbol?: string; annualReports?: RawReport[]; quarterlyReports?: RawReport[]; }
export interface RawGlobalQuoteData { "Global Quote"?: { "05. price"?: string; "09. change"?: string; "10. change percent"?: string; }; }
export interface RawBalanceSheetData { symbol?: string; annualReports?: RawReport[]; quarterlyReports?: RawReport[]; }
export interface RawDividend { ex_dividend_date?: string; amount?: string; }
export interface RawDividendHistoryData { data?: RawDividend[]; }

export interface RawApiData {
  income?: RawIncomeStatementData | null;
  earnings?: RawEarningsData | null;
  cashflow?: RawCashflowData | null;
  overview?: RawOverviewData | null;
  quote?: RawGlobalQuoteData | null;
  balanceSheet?: RawBalanceSheetData | null;
  dividends?: RawDividendHistoryData | null;
}