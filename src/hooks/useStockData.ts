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
  BalanceSheetMetrics,
} from '../types/stockDataTypes';

const initialStockData: StockData = { labels: [], values: [] };
const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };
const initialBalanceSheetMetrics: BalanceSheetMetrics = { cash: null, debt: null, netDebt: null };

type CachedProcessedData = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const useStockData = (): UseStockDataResult => {
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
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetrics | null>(initialBalanceSheetMetrics);
  
  const [annualFCF, setAnnualFCF] = useState<StockData>(initialStockData);
  const [quarterlyFCF, setQuarterlyFCF] = useState<StockData>(initialStockData);
  const [annualFCFPerShare, setAnnualFCFPerShare] = useState<StockData>(initialStockData);
  const [quarterlyFCFPerShare, setQuarterlyFCFPerShare] = useState<StockData>(initialStockData);
  const [annualPriceToFcf, setAnnualPriceToFcf] = useState<StockData>(initialStockData);
  const [quarterlyPriceToFcf, setQuarterlyPriceToFcf] = useState<StockData>(initialStockData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  const [cachedData, setCachedData] = useState<{ [ticker: string]: CachedProcessedData }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const fetchData = useCallback(async (ticker: string) => {
    if (cachedData[ticker]) {
      const cached = cachedData[ticker];
      setCompanyInfo(cached.companyInfo);
      setKeyMetrics(cached.keyMetrics);
      setBalanceSheetMetrics(cached.balanceSheetMetrics);
      setAnnualRevenue(cached.annualRevenue);
      setQuarterlyRevenue(cached.quarterlyRevenue);
      //... (alle anderen States aus dem Cache laden)
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
      setAnnualFCF(cached.annualFCF);
      setQuarterlyFCF(cached.quarterlyFCF);
      setAnnualFCFPerShare(cached.annualFCFPerShare);
      setQuarterlyFCFPerShare(cached.quarterlyFCFPerShare);
      setAnnualPriceToFcf(cached.annualPriceToFcf);
      setQuarterlyPriceToFcf(cached.quarterlyPriceToFcf);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    //... (alle States zurücksetzen)
    setCompanyInfo(null);
    setKeyMetrics(null);
    setBalanceSheetMetrics(initialBalanceSheetMetrics);
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
    setAnnualFCF(initialStockData);
    setQuarterlyFCF(initialStockData);
    setAnnualFCFPerShare(initialStockData);
    setQuarterlyFCFPerShare(initialStockData);
    setAnnualPriceToFcf(initialStockData);
    setQuarterlyPriceToFcf(initialStockData);

    try {
      setProgress(10);
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50);
      const processedData = processStockData(rawData, ticker);
      setProgress(90);

      //... (alle States setzen)
      setCompanyInfo(processedData.companyInfo);
      setKeyMetrics(processedData.keyMetrics);
      setBalanceSheetMetrics(processedData.balanceSheetMetrics);
      setPaysDividends(processedData.paysDividends);
      setAnnualRevenue(processedData.annualRevenue);
      setQuarterlyRevenue(processedData.quarterlyRevenue);
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
      setAnnualFCF(processedData.annualFCF);
      setQuarterlyFCF(processedData.quarterlyFCF);
      setAnnualFCFPerShare(processedData.annualFCFPerShare);
      setQuarterlyFCFPerShare(processedData.quarterlyFCFPerShare);
      setAnnualPriceToFcf(processedData.annualPriceToFcf);
      setQuarterlyPriceToFcf(processedData.quarterlyPriceToFcf);
      
      setCachedData(prevCache => ({ ...prevCache, [ticker]: processedData }));
      
      setProgress(100);
      setError(null);

    } catch (err: any) {
        setError(err.message);
        setBalanceSheetMetrics(initialBalanceSheetMetrics);
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return {
    loading, error, progress, companyInfo, keyMetrics, fetchData,
    annualRevenue, quarterlyRevenue, annualEPS, quarterlyEPS, annualDPS, quarterlyDPS,
    annualIncomeStatement, quarterlyIncomeStatement, annualMargins, quarterlyMargins,
    annualCashflowStatement, quarterlyCashflowStatement, annualTotalDividendsPaid, quarterlyTotalDividendsPaid,
    annualSharesOutstanding, quarterlySharesOutstanding, annualDebtToEquity, quarterlyDebtToEquity,
    paysDividends,
    balanceSheetMetrics,
    annualFCF,
    quarterlyFCF,
    annualFCFPerShare,
    quarterlyFCFPerShare,
    annualPriceToFcf,
    quarterlyPriceToFcf,
  };
};