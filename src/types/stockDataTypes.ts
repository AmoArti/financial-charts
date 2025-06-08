// src/types/stockDataTypes.ts

export interface BalanceSheetMetrics {
  cash: string | null;
  debt: string | null;
  netDebt: string | null;
}

export interface StockData {
  labels: (string | number)[];
  values: number[];
}

export interface MultiDatasetStockData {
  labels: (string | number)[];
  datasets: {
    label: string;
    values: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface CompanyInfo {
  Name: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string;
  LastSale: string;
  EarningsDate: string | null;
}

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
  payoutRatio: string | null;
  payoutDate: string | null;
  freeCashFlowYield: string | null;
}

export interface UseStockDataResult {
  annualRevenue: StockData;
  quarterlyRevenue: StockData;
  annualEPS: MultiDatasetStockData;
  quarterlyEPS: MultiDatasetStockData;
  annualDPS: StockData;
  quarterlyDPS: StockData;
  annualIncomeStatement: MultiDatasetStockData;
  quarterlyIncomeStatement: MultiDatasetStockData;
  annualMargins: MultiDatasetStockData;
  quarterlyMargins: MultiDatasetStockData;
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;
  annualTotalDividendsPaid: StockData;
  quarterlyTotalDividendsPaid: StockData;
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;
  annualDebtToEquity: StockData;
  quarterlyDebtToEquity: StockData;
  balanceSheetMetrics: BalanceSheetMetrics | null;
  paysDividends: boolean;
  loading: boolean;
  error: string | null;
  progress: number;
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null;
  fetchData: (ticker: string) => void;
}

export interface RawReport {
  fiscalDateEnding?: string;
  reportedCurrency?: string;
  grossProfit?: string;
  totalRevenue?: string;
  operatingIncome?: string;
  netIncome?: string;
  operatingCashflow?: string;
  capitalExpenditures?: string;
  dividendPayoutCommonStock?: string;
  dividendPayout?: string;
  totalAssets?: string;
  totalLiabilities?: string;
  totalShareholderEquity?: string;
  commonStockSharesOutstanding?: string;
  cashAndCashEquivalentsAtCarryingValue?: string;
  shortTermDebt?: string;
  longTermDebtNoncurrent?: string;
  longTermDebt?: string;
  [key: string]: any;
}

export interface RawIncomeStatementData { symbol?: string; annualReports?: RawReport[]; quarterlyReports?: RawReport[]; }
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
  overview?: any | null;
  quote?: RawGlobalQuoteData | null;
  balanceSheet?: RawBalanceSheetData | null;
  dividends?: RawDividendHistoryData | null;
}