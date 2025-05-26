// src/hooks/useStockData.ts
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

// Typ für die zwischengespeicherten Daten (basiert auf UseStockDataResult)
type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  const [annualRevenue, setAnnualRevenue] = useState<StockData>(initialStockData);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<StockData>(initialStockData);
  
  // EPS States jetzt vom Typ MultiDatasetStockData
  const [annualEPS, setAnnualEPS] = useState<MultiDatasetStockData>(initialMultiData);
  const [quarterlyEPS, setQuarterlyEPS] = useState<MultiDatasetStockData>(initialMultiData);
  
  const [annualDPS, setAnnualDPS] = useState<StockData>(initialStockData);
  const [quarterlyDPS, setQuarterlyDPS] = useState<StockData>(initialStockData);
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

  const [cachedData, setCachedData] = useState<{ [ticker: string]: CachedProcessedData }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const fetchData = useCallback(async (ticker: string) => {
    if (!apiKey) { setError('API-Schlüssel nicht gefunden...'); setLoading(false); return; }
    if (!ticker) { setError('Kein Ticker für die Suche angegeben.'); setLoading(false); return; }

    if (cachedData[ticker]) {
      console.log(`Using cached data for ${ticker}`);
      const cached = cachedData[ticker];
      setAnnualRevenue(cached.annualRevenue);
      setQuarterlyRevenue(cached.quarterlyRevenue);
      setAnnualEPS(cached.annualEPS); // Bleibt MultiDatasetStockData
      setQuarterlyEPS(cached.quarterlyEPS); // Bleibt MultiDatasetStockData
      setAnnualDPS(cached.annualDPS);
      setQuarterlyDPS(cached.quarterlyDPS);
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

    console.log(`Workspaceing new data from API for ${ticker}`); // Geändert von "Workspaceing"
    setLoading(true);
    setError(null);
    setProgress(0);
    setCompanyInfo(null);
    setKeyMetrics(null);
    setAnnualRevenue(initialStockData); 
    setQuarterlyRevenue(initialStockData);
    setAnnualEPS(initialMultiData); // Reset mit initialMultiData
    setQuarterlyEPS(initialMultiData); // Reset mit initialMultiData
    setAnnualDPS(initialStockData); 
    setQuarterlyDPS(initialStockData);
    setAnnualIncomeStatement(initialMultiData); 
    setQuarterlyIncomeStatement(initialMultiData);
    setAnnualMargins(initialMultiData); 
    setQuarterlyMargins(initialMultiData);
    setAnnualCashflowStatement(initialMultiData); 
    setQuarterlyCashflowStatement(initialMultiData);
    setAnnualTotalDividendsPaid(initialStockData); 
    setQuarterlyTotalDividendsPaid(initialStockData);
    setAnnualSharesOutstanding(initialStockData); 
    setQuarterlySharesOutstanding(initialStockData);
    setAnnualDebtToEquity(initialStockData); 
    setQuarterlyDebtToEquity(initialStockData);
    setPaysDividends(false);

    try {
      setProgress(10);
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50);

      const processedData = processStockData(rawData, ticker);
      setProgress(90);

      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setPaysDividends(processedData.paysDividends);
      setAnnualRevenue(processedData.annualRevenue);
      setQuarterlyRevenue(processedData.quarterlyRevenue);
      setAnnualEPS(processedData.annualEPS); // Ist jetzt MultiDatasetStockData
      setQuarterlyEPS(processedData.quarterlyEPS); // Ist jetzt MultiDatasetStockData
      setAnnualDPS(processedData.annualDPS);
      setQuarterlyDPS(processedData.quarterlyDPS);
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

      // Daten für den Cache vorbereiten und speichern
      const dataToCache: CachedProcessedData = {
        annualRevenue: processedData.annualRevenue,
        quarterlyRevenue: processedData.quarterlyRevenue,
        annualEPS: processedData.annualEPS, // Hier die neue Struktur
        quarterlyEPS: processedData.quarterlyEPS, // Hier die neue Struktur
        annualDPS: processedData.annualDPS,
        quarterlyDPS: processedData.quarterlyDPS,
        annualIncomeStatement: processedData.annualIncomeStatement,
        quarterlyIncomeStatement: processedData.quarterlyIncomeStatement,
        annualMargins: processedData.annualMargins,
        quarterlyMargins: processedData.quarterlyMargins,
        annualCashflowStatement: processedData.annualCashflowStatement,
        quarterlyCashflowStatement: processedData.quarterlyCashflowStatement,
        annualTotalDividendsPaid: processedData.annualTotalDividendsPaid,
        quarterlyTotalDividendsPaid: processedData.quarterlyTotalDividendsPaid,
        annualSharesOutstanding: processedData.annualSharesOutstanding,
        quarterlySharesOutstanding: processedData.quarterlySharesOutstanding,
        annualDebtToEquity: processedData.annualDebtToEquity,
        quarterlyDebtToEquity: processedData.quarterlyDebtToEquity,
        paysDividends: processedData.paysDividends,
        companyInfo: processedData.companyInfo,
        keyMetrics: processedData.keyMetrics,
      };
      setCachedData(prevCache => ({ ...prevCache, [ticker]: dataToCache }));


      setProgress(100);
      setError(null);

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      console.error("!!! useStockData: ERROR caught in fetchData !!!");
      console.error("Error Message:", errorMessage);
      console.error("Original Error Object:", err);
      setError(errorMessage);
      setCompanyInfo(null); 
      setKeyMetrics(null);
      setAnnualRevenue(initialStockData); 
      setQuarterlyRevenue(initialStockData);
      setAnnualEPS(initialMultiData); // Reset mit initialMultiData
      setQuarterlyEPS(initialMultiData); // Reset mit initialMultiData
      setAnnualDPS(initialStockData); 
      setQuarterlyDPS(initialStockData);
      setAnnualIncomeStatement(initialMultiData); 
      setQuarterlyIncomeStatement(initialMultiData);
      setAnnualMargins(initialMultiData); 
      setQuarterlyMargins(initialMultiData);
      setAnnualCashflowStatement(initialMultiData); 
      setQuarterlyCashflowStatement(initialMultiData);
      setAnnualTotalDividendsPaid(initialStockData); 
      setQuarterlyTotalDividendsPaid(initialStockData);
      setAnnualSharesOutstanding(initialStockData); 
      setQuarterlySharesOutstanding(initialStockData);
      setAnnualDebtToEquity(initialStockData); 
      setQuarterlyDebtToEquity(initialStockData);
      setPaysDividends(false);
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]); // Dependencies

  return {
    annualRevenue, quarterlyRevenue,
    annualEPS, quarterlyEPS, // Gibt jetzt MultiDatasetStockData zurück
    annualDPS, quarterlyDPS,
    annualIncomeStatement, quarterlyIncomeStatement,
    annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement,
    annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    annualSharesOutstanding, quarterlySharesOutstanding,
    annualDebtToEquity, quarterlyDebtToEquity,
    paysDividends,
    loading, error, progress, companyInfo, keyMetrics,
    fetchData,
  };
};
// --- Ende useStockData.ts ---