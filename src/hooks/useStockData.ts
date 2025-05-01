// src/hooks/useStockData.ts (Updated for Shares Outstanding)
import { useState, useCallback } from 'react';
import { fetchAlphaVantageData } from '../services/alphaVantageApi';
import { processStockData } from '../utils/stockDataProcessing';
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  UseStockDataResult, // Importiere den AKTUALISIERTEN Typ
  RawApiData
} from '../types/stockDataTypes';

// Leere Initialzustände für die Daten
const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };

// Typ für die zwischengespeicherten Daten (angepasst an UseStockDataResult)
type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  // Beachte: Namen und Typen sollten zum UseStockDataResult-Interface passen
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
  // NEU: States für Outstanding Shares
  const [annualSharesOutstanding, setAnnualSharesOutstanding] = useState<StockData>(initialStockData);
  const [quarterlySharesOutstanding, setQuarterlySharesOutstanding] = useState<StockData>(initialStockData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  // Cache für verarbeitete Daten (Typ angepasst)
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

    // Cache prüfen (Zugriffe angepasst)
    if (cachedData[ticker]) {
      console.log(`Using cached data for ${ticker}`);
      const cached = cachedData[ticker];
      // Alle Daten-States aus dem Cache setzen (inkl. Shares Outstanding)
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
      setAnnualSharesOutstanding(cached.annualSharesOutstanding); // NEU
      setQuarterlySharesOutstanding(cached.quarterlySharesOutstanding); // NEU
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setProgress(100);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset States für neuen Fetch (inkl. Shares Outstanding)
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
    setAnnualSharesOutstanding(initialStockData); setQuarterlySharesOutstanding(initialStockData); // NEU


    try {
      setProgress(10);
      // Schritt 1: API-Daten abrufen (holt jetzt auch Balance Sheet)
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50); // Nach erfolgreichem API-Call

      // Schritt 2: Rohdaten verarbeiten (gibt jetzt auch Shares Outstanding zurück)
      const processedData = processStockData(rawData, ticker);
      setProgress(90); // Nach erfolgreicher Verarbeitung

      // Schritt 3: State aktualisieren (inkl. Shares Outstanding)
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
      setAnnualSharesOutstanding(processedData.annualSharesOutstanding); // NEU
      setQuarterlySharesOutstanding(processedData.quarterlySharesOutstanding); // NEU

      setProgress(100);

      // Schritt 4: Cache aktualisieren (inkl. Shares Outstanding)
      setCachedData(prev => ({
        ...prev,
        [ticker]: { // Speichere die verarbeiteten Daten
          companyInfo: processedData.companyInfo,
          keyMetrics: processedData.keyMetrics,
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
          annualSharesOutstanding: processedData.annualSharesOutstanding, // NEU
          quarterlySharesOutstanding: processedData.quarterlySharesOutstanding, // NEU
        },
      }));

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      setError(errorMessage);
      console.error("Fehler in fetchData (Hook):", err);
      // Sicherstellen, dass alle Daten zurückgesetzt werden bei Fehler (inkl. Shares Outstanding)
      setCompanyInfo(null); setKeyMetrics(null);
      setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
      setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
      setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
      setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
      setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData);
      setAnnualSharesOutstanding(initialStockData); setQuarterlySharesOutstanding(initialStockData); // NEU
    } finally {
      setLoading(false); // Ladezustand immer beenden
    }
  }, [apiKey, cachedData]); // Abhängigkeiten: apiKey und Cache

  // --- Rückgabe des Hooks ---
  // (Angepasst an das neue UseStockDataResult Interface inkl. Shares Outstanding)
  return {
    // Daten-States
    annualRevenue, quarterlyRevenue,
    annualEPS, quarterlyEPS,
    annualIncomeStatement, quarterlyIncomeStatement,
    annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement,
    annualSharesOutstanding, quarterlySharesOutstanding, // NEU
    // Metadaten-States
    loading, error, progress, companyInfo, keyMetrics,
    // Funktion zum Triggern
    fetchData,
  };
};