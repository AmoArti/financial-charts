// src/hooks/useStockData.ts (Refactored & Updated for Cashflow Chart)
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

// Leere Initialzustände für die Daten (ggf. auslagern, falls woanders benötigt)
const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };

// Typ für die zwischengespeicherten Daten (angepasst an UseStockDataResult)
type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  // Beachte die Umbenennung von annualData -> annualRevenue etc.
  // und das Hinzufügen von annualCashflowStatement etc.
  const [annualRevenue, setAnnualRevenue] = useState<StockData>(initialStockData);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<StockData>(initialStockData);
  const [annualEPS, setAnnualEPS] = useState<StockData>(initialStockData);
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>(initialStockData);
  // Alte FCF States entfernt, da sie jetzt im CashflowStatement enthalten sind
  const [annualIncomeStatement, setAnnualIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyIncomeStatement, setQuarterlyIncomeStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [annualMargins, setAnnualMargins] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyMargins, setQuarterlyMargins] = useState<MultiDatasetStockData>(initialMultiData);
  // NEU: States für das Cashflow Statement Chart
  const [annualCashflowStatement, setAnnualCashflowStatement] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyCashflowStatement, setQuarterlyCashflowStatement] = useState<MultiDatasetStockData>(initialMultiData);

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
      // Alle Daten-States aus dem Cache setzen (Namen angepasst, neue hinzugefügt)
      setAnnualRevenue(cached.annualRevenue);
      setQuarterlyRevenue(cached.quarterlyRevenue);
      setAnnualEPS(cached.annualEPS);
      setQuarterlyEPS(cached.quarterlyEPS);
      setAnnualIncomeStatement(cached.annualIncomeStatement);
      setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement);
      setAnnualMargins(cached.annualMargins);
      setQuarterlyMargins(cached.quarterlyMargins);
      setAnnualCashflowStatement(cached.annualCashflowStatement); // NEU
      setQuarterlyCashflowStatement(cached.quarterlyCashflowStatement); // NEU
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setProgress(100);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset States für neuen Fetch (Namen angepasst, neue hinzugefügt)
    console.log(`Workspaceing new data from API for ${ticker}`);
    setLoading(true);
    setError(null);
    setProgress(0);
    setCompanyInfo(null);
    setKeyMetrics(null);
    setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
    setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
    // Alte FCF Resets entfernt
    setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
    setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
    setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData); // NEU


    try {
      setProgress(10);
      // Schritt 1: API-Daten abrufen
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50); // Nach erfolgreichem API-Call

      // Schritt 2: Rohdaten verarbeiten (Funktion gibt jetzt neue Struktur zurück)
      const processedData = processStockData(rawData, ticker);
      setProgress(90); // Nach erfolgreicher Verarbeitung

      // Schritt 3: State aktualisieren (Namen angepasst, neue hinzugefügt)
      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setAnnualRevenue(processedData.annualRevenue);
      setQuarterlyRevenue(processedData.quarterlyRevenue);
      setAnnualEPS(processedData.annualEPS);
      setQuarterlyEPS(processedData.quarterlyEPS);
      // Alte FCF Sets entfernt
      setAnnualIncomeStatement(processedData.annualIncomeStatement);
      setQuarterlyIncomeStatement(processedData.quarterlyIncomeStatement);
      setAnnualMargins(processedData.annualMargins);
      setQuarterlyMargins(processedData.quarterlyMargins);
      setAnnualCashflowStatement(processedData.annualCashflowStatement); // NEU
      setQuarterlyCashflowStatement(processedData.quarterlyCashflowStatement); // NEU

      setProgress(100);

      // Schritt 4: Cache aktualisieren (Namen angepasst, neue hinzugefügt)
      setCachedData(prev => ({
        ...prev,
        [ticker]: { // Speichere die verarbeiteten Daten
          companyInfo: processedData.companyInfo,
          keyMetrics: processedData.keyMetrics,
          annualRevenue: processedData.annualRevenue,
          quarterlyRevenue: processedData.quarterlyRevenue,
          annualEPS: processedData.annualEPS,
          quarterlyEPS: processedData.quarterlyEPS,
          // Alte FCF entfernt
          annualIncomeStatement: processedData.annualIncomeStatement,
          quarterlyIncomeStatement: processedData.quarterlyIncomeStatement,
          annualMargins: processedData.annualMargins,
          quarterlyMargins: processedData.quarterlyMargins,
          annualCashflowStatement: processedData.annualCashflowStatement, // NEU
          quarterlyCashflowStatement: processedData.quarterlyCashflowStatement, // NEU
        },
      }));

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      setError(errorMessage);
      console.error("Fehler in fetchData (Hook):", err);
      // Sicherstellen, dass alle Daten zurückgesetzt werden bei Fehler (Namen angepasst, neue hinzugefügt)
      setCompanyInfo(null); setKeyMetrics(null);
      setAnnualRevenue(initialStockData); setQuarterlyRevenue(initialStockData);
      setAnnualEPS(initialStockData); setQuarterlyEPS(initialStockData);
      // Alte FCF Resets entfernt
      setAnnualIncomeStatement(initialMultiData); setQuarterlyIncomeStatement(initialMultiData);
      setAnnualMargins(initialMultiData); setQuarterlyMargins(initialMultiData);
      setAnnualCashflowStatement(initialMultiData); setQuarterlyCashflowStatement(initialMultiData); // NEU
    } finally {
      setLoading(false); // Ladezustand immer beenden
    }
  }, [apiKey, cachedData]); // Abhängigkeiten: apiKey und Cache

  // --- Rückgabe des Hooks ---
  // (Angepasst an das neue UseStockDataResult Interface)
  return {
    // Daten-States
    annualRevenue, quarterlyRevenue, // Umbenannt
    annualEPS, quarterlyEPS,
    // Alte FCF entfernt
    annualIncomeStatement, quarterlyIncomeStatement,
    annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement, // NEU
    // Metadaten-States
    loading, error, progress, companyInfo, keyMetrics,
    // Funktion zum Triggern
    fetchData,
  };
};