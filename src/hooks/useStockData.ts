// src/hooks/useStockData.ts (Updated for Total Dividends Paid)
import { useState, useCallback } from 'react';
import { fetchAlphaVantageData } from '../services/alphaVantageApi';
import { processStockData } from '../utils/stockDataProcessing'; // Haupt-Processing-Funktion
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  UseStockDataResult, // Importiere den AKTUALISIERTEN Typ mit Total Dividends & Flag
  RawApiData
} from '../types/stockDataTypes';

// Leere Initialzustände für die Daten
const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };

// Typ für die zwischengespeicherten Daten (angepasst an UseStockDataResult)
type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  const [annualRevenue, setAnnualRevenue] = useState<StockData>(initialStockData);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<StockData>(initialStockData);
  const [annualEPS, setAnnualEPS] = useState<StockData>(initialStockData);
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>(initialStockData);
  const [annualIncomeStatement, setAnnualIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyIncomeStatement, setQuarterlyIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualMargins, setAnnualMargins] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyMargins, setQuarterlyMargins] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualCashflowStatement, setAnnualCashflowStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyCashflowStatement, setQuarterlyCashflowStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualSharesOutstanding, setAnnualSharesOutstanding] = useState<StockData>(initialStockData);
  const [quarterlySharesOutstanding, setQuarterlySharesOutstanding] = useState<StockData>(initialStockData);
  const [annualDebtToEquity, setAnnualDebtToEquity] = useState<StockData>(initialStockData);
  const [quarterlyDebtToEquity, setQuarterlyDebtToEquity] = useState<StockData>(initialStockData);
  // NEU: States für Total Dividends Paid & paysDividends Flag
  const [annualTotalDividendsPaid, setAnnualTotalDividendsPaid] = useState<StockData>(initialStockData);
  const [quarterlyTotalDividendsPaid, setQuarterlyTotalDividendsPaid] = useState<StockData>(initialStockData);
  const [paysDividends, setPaysDividends] = useState<boolean>(false); // Default: false

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  // Cache für verarbeitete Daten (Typ angepasst via Omit<UseStockDataResult,...>)
  const [cachedData, setCachedData] = useState<{ [ticker: string]: CachedProcessedData }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  // --- fetchData Funktion ---
  const fetchData = useCallback(async (ticker: string) => {
    if (!apiKey) {
      setError('API-Schlüssel nicht gefunden...');
      setLoading(false);
      return;
    }
    if (!ticker) {
      setError('Kein Ticker für die Suche angegeben.');
      setLoading(false);
      return;
    }

    // Cache prüfen (Zugriffe angepasst inkl. Total Dividends)
    if (cachedData[ticker]) {
      console.log(`Using cached data for ${ticker}`);
      const cached = cachedData[ticker];
      // Alle Daten-States aus dem Cache setzen
      setAnnualRevenue(cached.annualRevenue);
      setQuarterlyRevenue(cached.quarterlyRevenue);
      setAnnualEPS(cached.annualEPS);
      setQuarterlyEPS(cached.quarterlyEPS);
      setAnnualIncomeStatement(cached.annualIncomeStatement);
      setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement);
      setAnnualMargins(cached.annualMargins);
      setQuarterlyMargins(cached.quarterlyMargins);
      setAnnualCashflowStatement(cached.annualCashflowStatement);
      setQuarterlyCashflowStatement(cached.quarterlyCashflowStatement);
      setAnnualSharesOutstanding(cached.annualSharesOutstanding);
      setQuarterlySharesOutstanding(cached.quarterlySharesOutstanding);
      setAnnualDebtToEquity(cached.annualDebtToEquity);
      setQuarterlyDebtToEquity(cached.quarterlyDebtToEquity);
      setAnnualTotalDividendsPaid(cached.annualTotalDividendsPaid); // NEU
      setQuarterlyTotalDividendsPaid(cached.quarterlyTotalDividendsPaid); // NEU
      setPaysDividends(cached.paysDividends); // NEU
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setProgress(100);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset States für neuen Fetch (inkl. Total Dividends)
    console.log(`Workspaceing new data from API for ${ticker}`);
    setLoading(true);
    setError(null);
    setProgress(0);
    setCompanyInfo(null);
    setKeyMetrics(null);
    setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
    setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
    setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
    setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
    setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData);
    setAnnualSharesOutstanding(initialStockData); setQuarterlySharesOutstanding(initialStockData);
    setAnnualDebtToEquity(initialStockData); setQuarterlyDebtToEquity(initialStockData);
    setAnnualTotalDividendsPaid(initialStockData); setQuarterlyTotalDividendsPaid(initialStockData); // NEU
    setPaysDividends(false); // NEU


    try {
      setProgress(10);
      // Schritt 1: API-Daten abrufen
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50);

      // Schritt 2: Rohdaten verarbeiten (gibt jetzt auch Total Dividends & Flag zurück)
      const processedData = processStockData(rawData, ticker);
      setProgress(90);

      // Schritt 3: State aktualisieren (inkl. Total Dividends & Flag)
      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setAnnualRevenue(processedData.annualRevenue);
      setQuarterlyRevenue(processedData.quarterlyRevenue);
      setAnnualEPS(processedData.annualEPS);
      setQuarterlyEPS(processedData.quarterlyEPS);
      setAnnualIncomeStatement(processedData.annualIncomeStatement);
      setQuarterlyIncomeStatement(processedData.quarterlyIncomeStatement);
      setAnnualMargins(processedData.annualMargins);
      setQuarterlyMargins(processedData.quarterlyMargins);
      setAnnualCashflowStatement(processedData.annualCashflowStatement);
      setQuarterlyCashflowStatement(processedData.quarterlyCashflowStatement);
      setAnnualSharesOutstanding(processedData.annualSharesOutstanding);
      setQuarterlySharesOutstanding(processedData.quarterlySharesOutstanding);
      setAnnualDebtToEquity(processedData.annualDebtToEquity);
      setQuarterlyDebtToEquity(processedData.quarterlyDebtToEquity);
      setAnnualTotalDividendsPaid(processedData.annualTotalDividendsPaid); // NEU
      setQuarterlyTotalDividendsPaid(processedData.quarterlyTotalDividendsPaid); // NEU
      setPaysDividends(processedData.paysDividends); // NEU

      setProgress(100);

      // Schritt 4: Cache aktualisieren (inkl. Total Dividends & Flag)
      setCachedData(prev => ({
        ...prev,
        [ticker]: { // Speichere die verarbeiteten Daten
          companyInfo: processedData.companyInfo,
          keyMetrics: processedData.keyMetrics,
          paysDividends: processedData.paysDividends, // NEU
          annualRevenue: processedData.annualRevenue,
          quarterlyRevenue: processedData.quarterlyRevenue,
          annualEPS: processedData.annualEPS,
          quarterlyEPS: processedData.quarterlyEPS,
          annualIncomeStatement: processedData.annualIncomeStatement,
          quarterlyIncomeStatement: processedData.quarterlyIncomeStatement,
          annualMargins: processedData.annualMargins,
          quarterlyMargins: processedData.quarterlyMargins,
          annualCashflowStatement: processedData.annualCashflowStatement,
          quarterlyCashflowStatement: processedData.quarterlyCashflowStatement,
          annualTotalDividendsPaid: processedData.annualTotalDividendsPaid, // NEU
          quarterlyTotalDividendsPaid: processedData.quarterlyTotalDividendsPaid, // NEU
          annualSharesOutstanding: processedData.annualSharesOutstanding,
          quarterlySharesOutstanding: processedData.quarterlySharesOutstanding,
          annualDebtToEquity: processedData.annualDebtToEquity,
          quarterlyDebtToEquity: processedData.quarterlyDebtToEquity,
        },
      }));

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      setError(errorMessage);
      console.error("Fehler in fetchData (Hook):", err);
      // Sicherstellen, dass alle Daten zurückgesetzt werden bei Fehler (inkl. Total Dividends & Flag)
      setCompanyInfo(null); setKeyMetrics(null);
      setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
      setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
      setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
      setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
      setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData);
      setAnnualSharesOutstanding(initialStockData); setQuarterlySharesOutstanding(initialStockData);
      setAnnualDebtToEquity(initialStockData); setQuarterlyDebtToEquity(initialStockData);
      setAnnualTotalDividendsPaid(initialStockData); setQuarterlyTotalDividendsPaid(initialStockData); // NEU
      setPaysDividends(false); // NEU
    } finally {
      setLoading(false); // Ladezustand immer beenden
    }
  }, [apiKey, cachedData]); // Abhängigkeiten prüfen, sollte so passen

  // --- Rückgabe des Hooks ---
  // (Angepasst an das neue UseStockDataResult Interface inkl. Total Dividends & Flag)
  return {
    // Daten-States
    annualRevenue, quarterlyRevenue,
    annualEPS, quarterlyEPS,
    annualIncomeStatement, quarterlyIncomeStatement,
    annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement,
    annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    annualTotalDividendsPaid, quarterlyTotalDividendsPaid, // NEU
    paysDividends, // NEU
    // Metadaten-States
    loading, error, progress, companyInfo, keyMetrics,
    // Funktion zum Triggern
    fetchData,
  };
};
// --- Ende useStockData.ts ---