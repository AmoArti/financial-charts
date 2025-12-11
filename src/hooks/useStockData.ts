// src/hooks/useStockData.ts
import { useState, useCallback, useReducer } from 'react';
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

// Define State Type
interface StockDataState {
    annualRevenue: StockData;
    quarterlyRevenue: StockData;
    annualEPS: MultiDatasetStockData;
    quarterlyEPS: MultiDatasetStockData;
    annualDPS: StockData;
    quarterlyDPS: StockData;
    annualIncomeStatement: MultiDatasetStockData;
    quarterlyIncomeStatement: MultiDatasetStockData;
    annualMargins: MultiDatasetStockData;
    quarterlyMargins: MultiDatasetStockData;
    annualCashflowStatement: MultiDatasetStockData;
    quarterlyCashflowStatement: MultiDatasetStockData;
    annualTotalDividendsPaid: StockData;
    quarterlyTotalDividendsPaid: StockData;
    annualSharesOutstanding: StockData;
    quarterlySharesOutstanding: StockData;
    annualDebtToEquity: StockData;
    quarterlyDebtToEquity: StockData;
    paysDividends: boolean;
    balanceSheetMetrics: BalanceSheetMetrics | null;
    annualFCF: StockData;
    quarterlyFCF: StockData;
    annualFCFPerShare: StockData;
    quarterlyFCFPerShare: StockData;
    companyInfo: CompanyInfo | null;
    keyMetrics: KeyMetrics | null;
}

const initialState: StockDataState = {
    annualRevenue: initialStockData,
    quarterlyRevenue: initialStockData,
    annualEPS: initialMultiData,
    quarterlyEPS: initialMultiData,
    annualDPS: initialStockData,
    quarterlyDPS: initialStockData,
    annualIncomeStatement: initialMultiData,
    quarterlyIncomeStatement: initialMultiData,
    annualMargins: initialMultiData,
    quarterlyMargins: initialMultiData,
    annualCashflowStatement: initialMultiData,
    quarterlyCashflowStatement: initialMultiData,
    annualTotalDividendsPaid: initialStockData,
    quarterlyTotalDividendsPaid: initialStockData,
    annualSharesOutstanding: initialStockData,
    quarterlySharesOutstanding: initialStockData,
    annualDebtToEquity: initialStockData,
    quarterlyDebtToEquity: initialStockData,
    paysDividends: false,
    balanceSheetMetrics: initialBalanceSheetMetrics,
    annualFCF: initialStockData,
    quarterlyFCF: initialStockData,
    annualFCFPerShare: initialStockData,
    quarterlyFCFPerShare: initialStockData,
    companyInfo: null,
    keyMetrics: null,
};

type Action =
  | { type: 'SET_DATA'; payload: Partial<StockDataState> }
  | { type: 'RESET_DATA' };

const stockDataReducer = (state: StockDataState, action: Action): StockDataState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, ...action.payload };
        case 'RESET_DATA':
            return initialState;
        default:
            return state;
    }
};

export const useStockData = (): UseStockDataResult => {
  const [state, dispatch] = useReducer(stockDataReducer, initialState);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [cachedData, setCachedData] = useState<{ [ticker: string]: CachedProcessedData }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const fetchData = useCallback(async (ticker: string) => {
    if (cachedData[ticker]) {
      const cached = cachedData[ticker];
      dispatch({ type: 'SET_DATA', payload: cached });
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    dispatch({ type: 'RESET_DATA' });

    try {
      setProgress(10);
      const rawData: RawApiData = await fetchAlphaVantageData(ticker, apiKey);
      setProgress(50);
      const processedData = processStockData(rawData, ticker);
      setProgress(90);

      dispatch({ type: 'SET_DATA', payload: processedData });
      
      setCachedData(prevCache => ({ ...prevCache, [ticker]: processedData }));
      
      setProgress(100);
      setError(null);

    } catch (err: any) {
        setError(err.message);
        dispatch({ type: 'SET_DATA', payload: { balanceSheetMetrics: initialBalanceSheetMetrics } });
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return {
    loading, error, progress, fetchData,
    ...state,
    // Explicitly fallback to initial values if state is somehow incomplete (though reducer handles it)
    balanceSheetMetrics: state.balanceSheetMetrics || initialBalanceSheetMetrics
  };
};