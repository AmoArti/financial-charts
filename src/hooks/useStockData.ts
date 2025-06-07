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
  RawApiData,
  BalanceSheetMetrics, // NEU
} from '../types/stockDataTypes';

const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };
const initialBalanceSheetMetrics: BalanceSheetMetrics = { cash: null, debt: null, netDebt: null }; // NEU

type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
  // ... (die meisten States bleiben gleich)
  const [annualRevenue, setAnnualRevenue] = useState<StockData>(initialStockData);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<StockData>(initialStockData);
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
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetrics | null>(initialBalanceSheetMetrics); // NEU

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  const [cachedData, setCachedData] = useState<{ [ticker: string]: CachedProcessedData }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const fetchData = useCallback(async (ticker: string) => {
    if (cachedData[ticker]) {
      // ... (Caching-Logik bleibt gleich, aber um neue States erweitert)
      const cached = cachedData[ticker];
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setBalanceSheetMetrics(cached.balanceSheetMetrics); // NEU
      // ... (Rest der States)
      setAnnualRevenue(cached.annualRevenue);
      setQuarterlyRevenue(cached.quarterlyRevenue);
      setAnnualEPS(cached.annualEPS);
      setQuarterlyEPS(cached.quarterlyEPS);
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
      return;
    }

    setLoading(true);
    // ... (Reset-Logik bleibt gleich, aber um neue States erweitert)
    setError(null);
    setProgress(0);
    setCompanyInfo(null);
    setKeyMetrics(null);
    setBalanceSheetMetrics(initialBalanceSheetMetrics); // NEU
    // ... (Rest der Resets)
    setAnnualRevenue(initialStockData);
    setQuarterlyRevenue(initialStockData);
    setAnnualEPS(initialMultiData);
    setQuarterlyEPS(initialMultiData);
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

      // --- Setze alle States ---
      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setBalanceSheetMetrics(processedData.balanceSheetMetrics); // NEU
      setPaysDividends(processedData.paysDividends);
      setAnnualRevenue(processedData.annualRevenue);
      setQuarterlyRevenue(processedData.quarterlyRevenue);
      // ... (Rest der States)
      setAnnualEPS(processedData.annualEPS);
      setQuarterlyEPS(processedData.quarterlyEPS);
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
      
      // Caching
      setCachedData(prevCache => ({ ...prevCache, [ticker]: processedData }));
      
      setProgress(100);
      setError(null);

    } catch (err: any) {
        // ... (Error-Handling bleibt gleich, aber mit Reset für neue States)
        setError(err.message);
        setBalanceSheetMetrics(initialBalanceSheetMetrics); // NEU
        // ... (Rest der Resets)
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return {
    // ... (Rückgabewerte bleiben gleich, aber um neue States erweitert)
    loading, error, progress, companyInfo, keyMetrics, fetchData,
    annualRevenue, quarterlyRevenue, annualEPS, quarterlyEPS, annualDPS, quarterlyDPS,
    annualIncomeStatement, quarterlyIncomeStatement, annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement, annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    annualSharesOutstanding, quarterlySharesOutstanding, annualDebtToEquity, quarterlyDebtToEquity,
    paysDividends,
    balanceSheetMetrics, // NEU
  };
};