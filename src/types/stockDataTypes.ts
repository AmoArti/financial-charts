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
    grossMargin: string | null; // Berechnet aus Income Statement
    operatingMargin: string | null; // Berechnet aus Income Statement
  }
  
  // Rückgabe-Typ des useStockData Hooks
  export interface UseStockDataResult {
    annualData: StockData; // Revenue
    quarterlyData: StockData; // Revenue
    annualEPS: StockData;
    quarterlyEPS: StockData;
    annualFCF: StockData;
    quarterlyFCF: StockData;
    annualIncomeStatement: MultiDatasetStockData;
    quarterlyIncomeStatement: MultiDatasetStockData;
    annualMargins: MultiDatasetStockData; // Margen
    quarterlyMargins: MultiDatasetStockData; // Margen
    loading: boolean;
    error: string | null;
    progress: number;
    companyInfo: CompanyInfo | null;
    keyMetrics: KeyMetrics | null;
    fetchData: (ticker: string) => void;
  }
  
  // Typ für die Rohdaten, wie sie von der API (nach json()) kommen könnten
  // (Optional, aber hilfreich für den API Service)
  export interface RawApiData {
    income?: any;
    earnings?: any;
    cashflow?: any;
    overview?: any;
    quote?: any;
  }