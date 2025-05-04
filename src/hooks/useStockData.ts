// src/hooks/useStockData.ts (Final - Inkl. DPS State Management)
import { useState, useCallback } from 'react';
import { fetchAlphaVantageData } from '../services/alphaVantageApi';
import { processStockData } from '../utils/stockDataProcessing'; // Haupt-Processing-Funktion
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  UseStockDataResult, // Importiere den finalen Typ mit DPS
  RawApiData
} from '../types/stockDataTypes';

// Leere Initialzustände für die Daten
const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };

// Typ für die zwischengespeicherten Daten (basiert auf UseStockDataResult)
type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  // (Alle States, inklusive DPS)
  const [annualRevenue, setAnnualRevenue] = useState<StockData>(initialStockData);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<StockData>(initialStockData);
  const [annualEPS, setAnnualEPS] = useState<StockData>(initialStockData);
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>(initialStockData);
  const [annualDPS, setAnnualDPS] = useState<StockData>(initialStockData); // DPS State
  const [quarterlyDPS, setQuarterlyDPS] = useState<StockData>(initialStockData); // DPS State
  const [annualIncomeStatement, setAnnualIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyIncomeStatement, setQuarterlyIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualMargins, setAnnualMargins] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyMargins, setQuarterlyMargins] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualCashflowStatement, setAnnualCashflowStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyCashflowStatement, setQuarterlyCashflowStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualTotalDividendsPaid, setAnnualTotalDividendsPaid] = useState<StockData>(initialStockData);
  const [quarterlyTotalDividendsPaid, setQuarterlyTotalDividendsPaid] = useState<StockData>(initialStockData);
  const [annualSharesOutstanding, setAnnualSharesOutstanding] = useState<StockData>(initialStockData);
  const [quarterlySharesOutstanding, setQuarterlySharesOutstanding] = useState<StockData>(initialStockData);
  const [annualDebtToEquity, setAnnualDebtToEquity] = useState<StockData>(initialStockData);
  const [quarterlyDebtToEquity, setQuarterlyDebtToEquity] = useState<StockData>(initialStockData);
  const [paysDividends, setPaysDividends] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  // Cache für verarbeitete Daten
  const [cachedData, setCachedData] = useState<{ [ticker: string]: CachedProcessedData }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  // --- fetchData Funktion ---
  const fetchData = useCallback(async (ticker: string) => {
    if (!apiKey) { setError('API-Schlüssel nicht gefunden...'); setLoading(false); return; }
    if (!ticker) { setError('Kein Ticker für die Suche angegeben.'); setLoading(false); return; }

    // Cache prüfen (inkl. DPS)
    if (cachedData[ticker]) {
      console.log(`Using cached data for ${ticker}`);
      const cached = cachedData[ticker];
      // Alle Daten-States aus dem Cache setzen
      setAnnualRevenue(cached.annualRevenue);
      setQuarterlyRevenue(cached.quarterlyRevenue);
      setAnnualEPS(cached.annualEPS);
      setQuarterlyEPS(cached.quarterlyEPS);
      setAnnualDPS(cached.annualDPS); // Aus Cache
      setQuarterlyDPS(cached.quarterlyDPS); // Aus Cache
      setAnnualIncomeStatement(cached.annualIncomeStatement);
      setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement);
      setAnnualMargins(cached.annualMargins);
      setQuarterlyMargins(cached.quarterlyMargins);
      setAnnualCashflowStatement(cached.annualCashflowStatement);
      setQuarterlyCashflowStatement(cached.quarterlyCashflowStatement);
      setAnnualTotalDividendsPaid(cached.annualTotalDividendsPaid);
      setQuarterlyTotalDividendsPaid(cached.quarterlyTotalDividendsPaid);
      setAnnualSharesOutstanding(cached.annualSharesOutstanding);
      setQuarterlySharesOutstanding(cached.quarterlySharesOutstanding);
      setAnnualDebtToEquity(cached.annualDebtToEquity);
      setQuarterlyDebtToEquity(cached.quarterlyDebtToEquity);
      setPaysDividends(cached.paysDividends);
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setProgress(100);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset States für neuen Fetch (inkl. DPS)
    console.log(`Workspaceing new data from API for ${ticker}`);
    setLoading(true);
    setError(null);
    setProgress(0);
    setCompanyInfo(null);
    setKeyMetrics(null);
    setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
    setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
    setAnnualDPS(initialStockData); setQuarterlyDPS(initialStockData); // NEU: Reset
    setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
    setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
    setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData);
    setAnnualTotalDividendsPaid(initialStockData); setQuarterlyTotalDividendsPaid(initialStockData);
    setAnnualSharesOutstanding(initialStockData); setQuarterlySharesOutstanding(initialStockData);
    setAnnualDebtToEquity(initialStockData); setQuarterlyDebtToEquity(initialStockData);
    setPaysDividends(false);


    try {
      setProgress(10);
      // Schritt 1: API-Daten abrufen (holt jetzt auch Dividends History)
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50);

      // Schritt 2: Rohdaten verarbeiten (gibt jetzt auch DPS zurück)
      const processedData = processStockData(rawData, ticker);
      setProgress(90);
      // console.log(">>> useStockData: processedData Object:", JSON.stringify(processedData, null, 2)); // Optional: Debug Log

      // Schritt 3: State aktualisieren (inkl. DPS)
      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setPaysDividends(processedData.paysDividends);
      setAnnualRevenue(processedData.annualRevenue);
      setQuarterlyRevenue(processedData.quarterlyRevenue);
      setAnnualEPS(processedData.annualEPS);
      setQuarterlyEPS(processedData.quarterlyEPS);
      setAnnualDPS(processedData.annualDPS); // NEU: Setzen
      setQuarterlyDPS(processedData.quarterlyDPS); // NEU: Setzen
      setAnnualIncomeStatement(processedData.annualIncomeStatement);
      setQuarterlyIncomeStatement(processedData.quarterlyIncomeStatement);
      setAnnualMargins(processedData.annualMargins);
      setQuarterlyMargins(processedData.quarterlyMargins);
      setAnnualCashflowStatement(processedData.annualCashflowStatement);
      setQuarterlyCashflowStatement(processedData.quarterlyCashflowStatement);
      setAnnualTotalDividendsPaid(processedData.annualTotalDividendsPaid);
      setQuarterlyTotalDividendsPaid(processedData.quarterlyTotalDividendsPaid);
      setAnnualSharesOutstanding(processedData.annualSharesOutstanding);
      setQuarterlySharesOutstanding(processedData.quarterlySharesOutstanding);
      setAnnualDebtToEquity(processedData.annualDebtToEquity);
      setQuarterlyDebtToEquity(processedData.quarterlyDebtToEquity);

      setProgress(100);
      setError(null); // Sicherstellen, dass Error bei Erfolg null ist

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      console.error("!!! useStockData: ERROR caught in fetchData !!!"); // Behalte Error Log
      console.error("Error Message:", errorMessage);
      console.error("Original Error Object:", err);
      setError(errorMessage);
      // Reset States (inkl. DPS)
      setCompanyInfo(null); setKeyMetrics(null);
      setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
      setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
      setAnnualDPS(initialStockData); setQuarterlyDPS(initialStockData); // NEU: Reset
      setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
      setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
      setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData);
      setAnnualTotalDividendsPaid(initialStockData); setQuarterlyTotalDividendsPaid(initialStockData);
      setAnnualSharesOutstanding(initialStockData); setQuarterlySharesOutstanding(initialStockData);
      setAnnualDebtToEquity(initialStockData); setQuarterlyDebtToEquity(initialStockData);
      setPaysDividends(false);
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]); // Dependencies

  // --- Rückgabe des Hooks ---
  // (Angepasst an das finale UseStockDataResult Interface inkl. DPS)
  return {
    // Daten-States
    annualRevenue, quarterlyRevenue,
    annualEPS, quarterlyEPS,
    annualDPS, quarterlyDPS, // NEU
    annualIncomeStatement, quarterlyIncomeStatement,
    annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement,
    annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    paysDividends,
    // Metadaten-States
    loading, error, progress, companyInfo, keyMetrics,
    // Funktion zum Triggern
    fetchData,
  };
};
// --- Ende useStockData.ts ---