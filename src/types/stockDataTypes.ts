// src/types/stockDataTypes.ts

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
  Note?: string; // API Note, falls vorhanden
  Information?: string; // API Information, falls vorhanden
  [key: string]: any; // Fallback für weitere, nicht explizit genannte Felder
}

// Gemeinsame Felder für Income, Cashflow, BalanceSheet Reports
export interface RawReport {
  fiscalDateEnding?: string;
  reportedCurrency?: string;
  // Income Statement spezifische Felder (Beispiele - müssen verfeinert werden)
  grossProfit?: string;
  totalRevenue?: string;
  costOfRevenue?: string; // Beispiel hinzugefügt
  costofGoodsAndServicesSold?: string; // Beispiel hinzugefügt
  operatingIncome?: string;
  sellingGeneralAndAdministrative?: string; // Beispiel hinzugefügt
  researchAndDevelopment?: string; // Beispiel hinzugefügt
  operatingExpenses?: string; // Beispiel hinzugefügt
  investmentIncomeNet?: string; // Beispiel hinzugefügt
  netInterestIncome?: string; // Beispiel hinzugefügt
  interestIncome?: string; // Beispiel hinzugefügt
  interestExpense?: string; // Beispiel hinzugefügt
  nonInterestIncome?: string; // Beispiel hinzugefügt
  otherNonOperatingIncome?: string; // Beispiel hinzugefügt
  depreciation?: string; // Beispiel hinzugefügt
  depreciationAndAmortization?: string; // Beispiel hinzugefügt
  incomeBeforeTax?: string; // Beispiel hinzugefügt
  incomeTaxExpense?: string; // Beispiel hinzugefügt
  interestAndDebtExpense?: string; // Beispiel hinzugefügt
  netIncomeFromContinuingOperations?: string; // Beispiel hinzugefügt
  comprehensiveIncomeNetOfTax?: string; // Beispiel hinzugefügt
  ebit?: string; // Beispiel hinzugefügt
  ebitda?: string; // Beispiel hinzugefügt (obwohl auch in Overview)
  netIncome?: string;
  // Cashflow spezifische Felder (Beispiele - müssen verfeinert werden)
  operatingCashflow?: string;
  paymentsForOperatingActivities?: string; // Beispiel hinzugefügt
  proceedsFromOperatingActivities?: string; // Beispiel hinzugefügt
  changeInOperatingLiabilities?: string; // Beispiel hinzugefügt
  changeInOperatingAssets?: string; // Beispiel hinzugefügt
  depreciationDepletionAndAmortization?: string; // Beispiel hinzugefügt
  capitalExpenditures?: string;
  changeInReceivables?: string; // Beispiel hinzugefügt
  changeInInventory?: string; // Beispiel hinzugefügt
  profitLoss?: string; // Beispiel hinzugefügt
  cashflowFromInvestment?: string; // Beispiel hinzugefügt
  cashflowFromFinancing?: string; // Beispiel hinzugefügt
  proceedsFromRepaymentsOfShortTermDebt?: string; // Beispiel hinzugefügt
  paymentsForRepurchaseOfCommonStock?: string; // Beispiel hinzugefügt
  paymentsForRepurchaseOfEquity?: string; // Beispiel hinzugefügt
  paymentsForRepurchaseOfPreferredStock?: string; // Beispiel hinzugefügt
  dividendPayout?: string;
  dividendPayoutCommonStock?: string;
  proceedsFromIssuanceOfCommonStock?: string; // Beispiel hinzugefügt
  proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet?: string; // Beispiel hinzugefügt
  proceedsFromIssuanceOfPreferredStock?: string; // Beispiel hinzugefügt
  proceedsFromRepurchaseOfEquity?: string; // Beispiel hinzugefügt
  proceedsFromSaleOfTreasuryStock?: string; // Beispiel hinzugefügt
  changeInCashAndCashEquivalents?: string; // Beispiel hinzugefügt
  changeInExchangeRate?: string; // Beispiel hinzugefügt
  netIncomeCF?: string; // 'netIncome' wird oft auch im Cashflow-Statement aufgeführt
  // Balance Sheet spezifische Felder (Beispiele - müssen verfeinert werden)
  totalAssets?: string;
  totalCurrentAssets?: string; // Beispiel hinzugefügt
  cashAndCashEquivalentsAtCarryingValue?: string; // Beispiel hinzugefügt
  cashAndShortTermInvestments?: string; // Beispiel hinzugefügt
  inventory?: string; // Beispiel hinzugefügt
  currentNetReceivables?: string; // Beispiel hinzugefügt
  totalNonCurrentAssets?: string; // Beispiel hinzugefügt
  propertyPlantEquipment?: string; // Beispiel hinzugefügt
  accumulatedDepreciationAmortizationPPE?: string; // Beispiel hinzugefügt
  intangibleAssets?: string; // Beispiel hinzugefügt
  intangibleAssetsExcludingGoodwill?: string; // Beispiel hinzugefügt
  goodwill?: string; // Beispiel hinzugefügt
  investments?: string; // Beispiel hinzugefügt
  longTermInvestments?: string; // Beispiel hinzugefügt
  shortTermInvestments?: string; // Beispiel hinzugefügt
  otherCurrentAssets?: string; // Beispiel hinzugefügt
  otherNonCurrentAssets?: string; // Beispiel hinzugefügt
  totalLiabilities?: string;
  totalCurrentLiabilities?: string; // Beispiel hinzugefügt
  currentAccountsPayable?: string; // Beispiel hinzugefügt
  deferredRevenue?: string; // Beispiel hinzugefügt
  currentDebt?: string; // Beispiel hinzugefügt
  shortTermDebt?: string; // Beispiel hinzugefügt
  totalNonCurrentLiabilities?: string; // Beispiel hinzugefügt
  longTermDebt?: string; // Beispiel hinzugefügt
  currentLongTermDebt?: string; // Beispiel hinzugefügt
  longTermDebtNoncurrent?: string; // Beispiel hinzugefügt
  shortLongTermDebtTotal?: string; // Beispiel hinzugefügt
  otherCurrentLiabilities?: string; // Beispiel hinzugefügt
  otherNonCurrentLiabilities?: string; // Beispiel hinzugefügt
  totalShareholderEquity?: string;
  treasuryStock?: string; // Beispiel hinzugefügt
  retainedEarnings?: string; // Beispiel hinzugefügt
  commonStock?: string; // Beispiel hinzugefügt
  commonStockSharesOutstanding?: string;
  [key: string]: any; // Für weitere feldspezifische Daten
}

export interface RawIncomeStatementData {
  Symbol?: string;
  annualReports?: RawReport[];
  quarterlyReports?: RawReport[];
  Note?: string;
  Information?: string;
  [key: string]: any;
}

export interface RawEarningReport {
  fiscalDateEnding?: string;
  reportedDate?: string;
  reportedEPS?: string;
  estimatedEPS?: string;
  surprise?: string;
  surprisePercentage?: string;
  [key: string]: any;
}

export interface RawEarningsData {
  symbol?: string;
  annualEarnings?: RawEarningReport[];
  quarterlyEarnings?: RawEarningReport[];
  Note?: string;
  Information?: string;
  [key: string]: any;
}

export interface RawCashflowData {
  symbol?: string;
  annualReports?: RawReport[];
  quarterlyReports?: RawReport[];
  Note?: string;
  Information?: string;
  [key: string]: any;
}

export interface RawGlobalQuoteData {
  "Global Quote"?: {
    "01. symbol"?: string;
    "02. open"?: string;
    "03. high"?: string;
    "04. low"?: string;
    "05. price"?: string;
    "06. volume"?: string;
    "07. latest trading day"?: string; // Format "YYYY-MM-DD"
    "08. previous close"?: string;
    "09. change"?: string;
    "10. change percent"?: string; // z.B. "1.2345%"
    [key: string]: any;
  };
  Note?: string;
  Information?: string;
  [key: string]: any;
}

export interface RawBalanceSheetData {
  symbol?: string;
  annualReports?: RawReport[];
  quarterlyReports?: RawReport[];
  Note?: string;
  Information?: string;
  [key: string]: any;
}

export interface RawDividend {
  ex_dividend_date?: string; // Format "YYYY-MM-DD"
  declaration_date?: string; // Format "YYYY-MM-DD"
  record_date?: string; // Format "YYYY-MM-DD"
  payment_date?: string; // Format "YYYY-MM-DD"
  amount?: string; // Betrag der Dividende
  [key: string]: any;
}
export interface RawDividendHistoryData {
  data?: RawDividend[];
  Note?: string;
  Information?: string;
  [key: string]: any;
}


// Typ für die Rohdaten, wie sie von der API (nach json()) kommen könnten
export interface RawApiData {
  income?: RawIncomeStatementData | null;
  earnings?: RawEarningsData | null;
  cashflow?: RawCashflowData | null;
  overview?: RawOverviewData | null;
  quote?: RawGlobalQuoteData | null;
  balanceSheet?: RawBalanceSheetData | null;
  dividends?: RawDividendHistoryData | null;
}

// --- Ende src/types/stockDataTypes.ts ---