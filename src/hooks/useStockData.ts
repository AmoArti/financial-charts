// src/hooks/useStockData.ts (Refactored)
import { useState, useCallback } from 'react';
import { fetchAlphaVantageData } from '../services/alphaVantageApi';
import { processStockData } from '../utils/stockDataProcessing';
import {
  StockData,
  CompanyInfo,
  KeyMetrics,
  MultiDatasetStockData,
  UseStockDataResult,
  RawApiData
} from '../types/stockDataTypes';

// Leere Initialzustände für die Daten
const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  const [annualData, setAnnualData] = useState<StockData>(initialStockData);
  const [quarterlyData, setQuarterlyData] = useState<StockData>(initialStockData);
  const [annualEPS, setAnnualEPS] = useState<StockData>(initialStockData);
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>(initialStockData);
  const [annualFCF, setAnnualFCF] = useState<StockData>(initialStockData);
  const [quarterlyFCF, setQuarterlyFCF] = useState<StockData>(initialStockData);
  const [annualIncomeStatement, setAnnualIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyIncomeStatement, setQuarterlyIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualMargins, setAnnualMargins] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyMargins, setQuarterlyMargins] = useState<MultiDatasetStockData>(initialMultiData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  // Cache für verarbeitete Daten
  const [cachedData, setCachedData] = useState<{ [ticker: string]: Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'> }>({});

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

    // Cache prüfen
    if (cachedData[ticker]) {
      console.log(`Using cached data for ${ticker}`);
      const cached = cachedData[ticker];
      // Alle Daten-States aus dem Cache setzen
      setAnnualData(cached.annualData);
      setQuarterlyData(cached.quarterlyData);
      setAnnualEPS(cached.annualEPS);
      setQuarterlyEPS(cached.quarterlyEPS);
      setAnnualFCF(cached.annualFCF);
      setQuarterlyFCF(cached.quarterlyFCF);
      setAnnualIncomeStatement(cached.annualIncomeStatement);
      setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement);
      setAnnualMargins(cached.annualMargins);
      setQuarterlyMargins(cached.quarterlyMargins);
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setProgress(100);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset States für neuen Fetch
    console.log(`Fetching new data from API for ${ticker}`);
    setLoading(true);
    setError(null);
    setProgress(0);
    setCompanyInfo(null);
    setKeyMetrics(null);
    setAnnualData(initialStockData); setQuarterlyData(initialStockData);
    setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
    setAnnualFCF(initialStockData); setQuarterlyFCF(initialStockData);
    setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
    setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);


    try {
      setProgress(10);
      // Schritt 1: API-Daten abrufen
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50); // Nach erfolgreichem API-Call

      // Schritt 2: Rohdaten verarbeiten
      const processedData = processStockData(rawData, ticker);
      setProgress(90); // Nach erfolgreicher Verarbeitung

      // Schritt 3: State aktualisieren
      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setAnnualData(processedData.annualData);
      setQuarterlyData(processedData.quarterlyData);
      setAnnualEPS(processedData.annualEPS);
      setQuarterlyEPS(processedData.quarterlyEPS);
      setAnnualFCF(processedData.annualFCF);
      setQuarterlyFCF(processedData.quarterlyFCF);
      setAnnualIncomeStatement(processedData.annualIncomeStatement);
      setQuarterlyIncomeStatement(processedData.quarterlyIncomeStatement);
      setAnnualMargins(processedData.annualMargins);
      setQuarterlyMargins(processedData.quarterlyMargins);

      setProgress(100);

      // Schritt 4: Cache aktualisieren
      setCachedData(prev => ({
        ...prev,
        [ticker]: { // Speichere die verarbeiteten Daten
          companyInfo: processedData.companyInfo,
          keyMetrics: processedData.keyMetrics,
          annualData: processedData.annualData,
          quarterlyData: processedData.quarterlyData,
          annualEPS: processedData.annualEPS,
          quarterlyEPS: processedData.quarterlyEPS,
          annualFCF: processedData.annualFCF,
          quarterlyFCF: processedData.quarterlyFCF,
          annualIncomeStatement: processedData.annualIncomeStatement,
          quarterlyIncomeStatement: processedData.quarterlyIncomeStatement,
          annualMargins: processedData.annualMargins,
          quarterlyMargins: processedData.quarterlyMargins,
        },
      }));

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      setError(errorMessage);
      console.error("Fehler in fetchData (Hook):", err);
      // Sicherstellen, dass alle Daten zurückgesetzt werden bei Fehler
      setCompanyInfo(null); setKeyMetrics(null);
      setAnnualData(initialStockData); setQuarterlyData(initialStockData);
      setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
      setAnnualFCF(initialStockData); setQuarterlyFCF(initialStockData);
      setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
      setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
    } finally {
      setLoading(false); // Ladezustand immer beenden
    }
  }, [apiKey, cachedData]); // Abhängigkeiten: apiKey und Cache

  // --- Rückgabe des Hooks ---
  return {
    // Daten-States
    annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF,
    annualIncomeStatement, quarterlyIncomeStatement, annualMargins, quarterlyMargins,
    // Metadaten-States
    loading, error, progress, companyInfo, keyMetrics,
    // Funktion zum Triggern
    fetchData,
  };
};