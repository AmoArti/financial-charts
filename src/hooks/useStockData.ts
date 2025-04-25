// src/hooks/useStockData.ts (Fix: ReferenceError für Labels)
import { useState, useCallback } from 'react';
// Importiere Typen und Funktionen aus utils
import { formatQuarter, trimMultiData, MultiDatasetStockData } from '../utils/utils';

// --- Interfaces ---
export interface StockData { labels: (string | number)[]; values: number[]; }
export interface CompanyInfo {
    Name: string; Industry: string; Address: string;
    MarketCapitalization: string; LastSale: string;
 }
export interface KeyMetrics {
    peRatio: string | null; psRatio: string | null; pbRatio: string | null;
    evToEbitda: string | null; dividendYield: string | null; priceChange: string | null;
    priceChangePercent: string | null; isPositiveChange: boolean; grossMargin: string | null;
    operatingMargin: string | null;
}
// UseStockDataResult Interface - fetchData Signatur geändert
interface UseStockDataResult {
  chartData: StockData; // Default/Revenue Annual für kleines Chart
  annualData: StockData; // Revenue Annual (für kleines Chart)
  quarterlyData: StockData; // Revenue Quarterly (wird derzeit nicht für kleines Chart genutzt)
  annualEPS: StockData; // Annual EPS (für kleines Chart / Modal)
  quarterlyEPS: StockData; // Quarterly EPS (für Modal)
  annualFCF: StockData; // Annual FCF (für kleines Chart / Modal)
  quarterlyFCF: StockData; // Quarterly FCF (für Modal)
  annualIncomeStatement: MultiDatasetStockData; // Annual Income Stmt (für großes Chart)
  quarterlyIncomeStatement: MultiDatasetStockData; // Quarterly Income Stmt (für großes Chart)
  loading: boolean;
  error: string | null;
  progress: number;
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null;
  fetchData: (ticker: string) => void; // Kein 'years' Parameter mehr
}

// --- Helper Functions ---
const formatMetric = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value); const num = parseFloat(stringValue);
    return isNaN(num) ? null : stringValue;
};
const formatPercentage = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value).replace('%', ''); const numValue = parseFloat(stringValue);
    if (isNaN(numValue)) return null;
    return String(value).includes('%') ? `${numValue.toFixed(2)}%` : `${(numValue * 100).toFixed(2)}%`;
};
const formatPriceChange = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const num = parseFloat(String(value)); return isNaN(num) ? null : num.toFixed(2);
};
const formatMargin = (value: number | null): string | null => {
    if (value === null || isNaN(value) || !isFinite(value)) return null;
    return `${value.toFixed(2)}%`;
};

// TrimData Funktion für einzelne Datensätze
const trimData = (labels: (string | number)[], values: number[]): StockData => {
    // Stelle sicher, dass labels und values gültige Arrays sind
    if (!Array.isArray(labels) || !Array.isArray(values)) {
        return { labels: [], values: [] };
    }
    const firstNonZeroIndex = values.findIndex(value => value !== 0);
    if (firstNonZeroIndex === -1 || values.length === 0 || labels.length === 0 || labels.length !== values.length) {
        return { labels: [], values: [] }; // Leere oder inkonsistente Daten
    }
    // Stelle sicher, dass Labels und Werte konsistent gekürzt werden
    return { labels: labels.slice(firstNonZeroIndex), values: values.slice(firstNonZeroIndex) };
};


// --- The Hook ---
export const useStockData = (): UseStockDataResult => {
  // --- States ---
  const [chartData, setChartData] = useState<StockData>({ labels: [], values: [] });
  const [annualData, setAnnualData] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyData, setQuarterlyData] = useState<StockData>({ labels: [], values: [] });
  const [annualEPS, setAnnualEPS] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>({ labels: [], values: [] });
  const [annualFCF, setAnnualFCF] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyFCF, setQuarterlyFCF] = useState<StockData>({ labels: [], values: [] });
  const [annualIncomeStatement, setAnnualIncomeStatement] = useState<MultiDatasetStockData>({ labels: [], datasets: [] });
  const [quarterlyIncomeStatement, setQuarterlyIncomeStatement] = useState<MultiDatasetStockData>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [cachedData, setCachedData] = useState<{ [ticker: string]: any }>({});
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  // fetchData Definition - ohne 'years' Parameter
  const fetchData = useCallback(async (ticker: string) => {
    if (!apiKey) { setError('API-Schlüssel nicht gefunden...'); setLoading(false); return; }

    // Cache prüfen (nur nach Ticker)
    if (cachedData[ticker]) {
       console.log(`Using cached data for ${ticker}`);
       const cached = cachedData[ticker];
       setAnnualData(cached.annualData || { labels: [], values: [] });
       setQuarterlyData(cached.quarterlyData || { labels: [], values: [] });
       setAnnualEPS(cached.annualEPS || { labels: [], values: [] });
       setQuarterlyEPS(cached.quarterlyEPS || { labels: [], values: [] });
       setAnnualFCF(cached.annualFCF || { labels: [], values: [] });
       setQuarterlyFCF(cached.quarterlyFCF || { labels: [], values: [] });
       setAnnualIncomeStatement(cached.annualIncomeStatement || { labels: [], datasets: [] });
       setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement || { labels: [], datasets: [] });
       setChartData(cached.chartData || { labels: [], values: [] });
       setCompanyInfo(cached.companyInfo || null);
       setKeyMetrics(cached.keyMetrics || null);
       setProgress(100); setError(null); setLoading(false);
       return;
    }

    // Reset States bei neuem Fetch
    console.log(`Workspaceing new data from API for ${ticker} (MAX available)`);
    setLoading(true); setError(null); setProgress(0);
    setCompanyInfo(null); setKeyMetrics(null);
    setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
    setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
    setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
    setAnnualIncomeStatement({ labels: [], datasets: [] }); setQuarterlyIncomeStatement({ labels: [], datasets: [] });
    setChartData({ labels: [], values: [] });


    try {
      setProgress(10);
      // API Calls
      const [incomeResponse, earningsResponse, cashFlowResponse, overviewResponse, quoteResponse] = await Promise.all([
        fetch(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`),
      ]);
      setProgress(50);
      const [incomeData, earningsData, cashFlowData, overviewData, quoteData] = await Promise.all([
        incomeResponse.json(), earningsResponse.json(), cashFlowResponse.json(), overviewResponse.json(), quoteResponse.json(),
      ]);
      setProgress(90);

      // Fehlerprüfungen
      let hasCashflowData = !!(cashFlowData?.annualReports || cashFlowData?.quarterlyReports);
      let hasIncomeData = !!(incomeData?.annualReports || incomeData?.quarterlyReports);
      let hasEarningsData = !!(earningsData?.annualEarnings || earningsData?.quarterlyEarnings);

      if (incomeData['Error Message']) { throw new Error(`API-Fehler bei INCOME_STATEMENT: ${incomeData['Error Message']}`); }
      if (incomeData['Note']) { console.warn(`API-Limit Note: INCOME_STATEMENT – ${incomeData['Note']}`);}
      if (earningsData['Error Message']) { throw new Error(`API-Fehler bei EARNINGS: ${earningsData['Error Message']}`); }
      if (earningsData['Note']) { console.warn(`API-Limit Note: EARNINGS – ${earningsData['Note']}`); }
      if (cashFlowData['Error Message']) { throw new Error(`API-Fehler bei CASH_FLOW: ${cashFlowData['Error Message']}`); }
      if (cashFlowData['Note']) { console.warn(`API-Limit Note: CASH_FLOW – ${cashFlowData['Note']}`); }
      if (overviewData['Error Message']) { throw new Error(`API-Fehler bei OVERVIEW: ${overviewData['Error Message']}`); }
      if (overviewData['Note']) { console.warn(`API-Limit Note: OVERVIEW – ${overviewData['Note']}`); }
      if (!overviewData?.Symbol) { throw new Error('Keine Unternehmensinformationen (OVERVIEW) für diesen Ticker verfügbar.'); }
      if (quoteData['Error Message']) { throw new Error(`API-Fehler bei GLOBAL_QUOTE: ${quoteData['Error Message']}`); }
      if (quoteData['Note']) { console.warn(`API-Limit Note: GLOBAL_QUOTE – ${quoteData['Note']}`); }

      const globalQuotePrice = quoteData?.['Global Quote']?.['05. price'];
      if (!hasIncomeData && !hasEarningsData && !hasCashflowData) { throw new Error('Keine Finanzdaten (Income, Earnings, Cashflow) für diesen Ticker verfügbar.');}

      // Company Info setzen
      const currentCompanyInfo: CompanyInfo = {
        Name: overviewData.Name || ticker,
        Industry: overviewData.Industry || 'N/A',
        Address: overviewData.Address || 'N/A',
        MarketCapitalization: overviewData.MarketCapitalization || 'N/A',
        LastSale: globalQuotePrice ? parseFloat(globalQuotePrice).toFixed(2) : 'N/A',
      };
      setCompanyInfo(currentCompanyInfo);

      // Key Metrics extrahieren
      let calculatedGrossMargin: number | null = null;
      let calculatedOperatingMargin: number | null = null;
      if (hasIncomeData && incomeData.annualReports && incomeData.annualReports.length > 0) {
        const latestAnnualIncomeReport = incomeData.annualReports[0];
        if (latestAnnualIncomeReport) {
            const totalRevenue = parseFloat(latestAnnualIncomeReport.totalRevenue) || 0;
            if (totalRevenue > 0) {
                const grossProfit = parseFloat(latestAnnualIncomeReport.grossProfit) || 0;
                const operatingIncome = parseFloat(latestAnnualIncomeReport.operatingIncome) || 0;
                calculatedGrossMargin = (grossProfit / totalRevenue) * 100;
                calculatedOperatingMargin = (operatingIncome / totalRevenue) * 100;
            }
        }
      }
      const rawChange = quoteData?.['Global Quote']?.['09. change'];
      const rawChangePercent = quoteData?.['Global Quote']?.['10. change percent'];
      const numChange = parseFloat(rawChange || '');

      // Debugging Logs für Rohdaten (können später entfernt werden)
      console.log('DEBUG: Raw key metric inputs from API:', { /* ... */ });

      const currentKeyMetrics: KeyMetrics = {
         peRatio: formatMetric(overviewData.PERatio),
         psRatio: formatMetric(overviewData.PriceToSalesRatioTTM),
         pbRatio: formatMetric(overviewData.PriceToBookRatio),
         evToEbitda: formatMetric(overviewData.EVToEBITDA),
         dividendYield: formatPercentage(overviewData.DividendYield),
         priceChange: formatPriceChange(rawChange),
         priceChangePercent: formatPercentage(rawChangePercent),
         isPositiveChange: !isNaN(numChange) && numChange >= 0,
         grossMargin: formatMargin(calculatedGrossMargin),
         operatingMargin: formatMargin(calculatedOperatingMargin)
      };
      console.log('DEBUG: Calculated keyMetrics object:', currentKeyMetrics);
      setKeyMetrics(currentKeyMetrics);

      // --- Datenverarbeitung für Charts (MAX Daten verarbeiten) ---
      const parseAndScale = (value: string | undefined | null): number => {
         if (value === undefined || value === null || value === "None") return 0;
         const num = parseFloat(value);
         return isNaN(num) ? 0 : num / 1e9;
      };

      // Temporäre Variablen für verarbeitete Daten
      let tempAnnualRevenue: StockData = { labels: [], values: [] };
      let tempQuarterlyRevenue: StockData = { labels: [], values: [] };
      let tempAnnualEPS: StockData = { labels: [], values: [] };
      let tempQuarterlyEPS: StockData = { labels: [], values: [] };
      let tempAnnualFCF: StockData = { labels: [], values: [] };
      let tempQuarterlyFCF: StockData = { labels: [], values: [] };
      let tempAnnualIncome: MultiDatasetStockData = { labels: [], datasets: [] };
      let tempQuarterlyIncome: MultiDatasetStockData = { labels: [], datasets: [] };

      // *** FIX: Deklariere Label-Arrays HIER (ausserhalb der IFs) ***
      let annualLabelsEPS: (string | number)[] = [];
      let quarterlyLabelsEPS: string[] = [];
      let annualLabelsFCF: (string | number)[] = [];
      let quarterlyLabelsFCF: string[] = [];
      let annualLabelsInc: (string | number)[] = [];
      let quarterlyLabelsInc: string[] = [];


      // Verarbeite *alle* verfügbaren Reports
      if (hasIncomeData) {
          const annualReports = (incomeData.annualReports || []).sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
          const quarterlyReports = (incomeData.quarterlyReports || []).sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());

          annualLabelsInc = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
          tempAnnualIncome = {
              labels: annualLabelsInc,
              datasets: [
                  { label: 'Revenue', values: annualReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                  { label: 'Gross Profit', values: annualReports.map((r: any) => parseAndScale(r.grossProfit)) },
                  { label: 'Operating Income', values: annualReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                  { label: 'Net Income', values: annualReports.map((r: any) => parseAndScale(r.netIncome)) },
              ]
          };
          tempAnnualRevenue = { labels: annualLabelsInc, values: tempAnnualIncome.datasets[0]?.values || [] };

          quarterlyLabelsInc = quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
          tempQuarterlyIncome = {
              labels: quarterlyLabelsInc,
              datasets: [
                  { label: 'Revenue', values: quarterlyReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                  { label: 'Gross Profit', values: quarterlyReports.map((r: any) => parseAndScale(r.grossProfit)) },
                  { label: 'Operating Income', values: quarterlyReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                  { label: 'Net Income', values: quarterlyReports.map((r: any) => parseAndScale(r.netIncome)) },
              ]
          };
           tempQuarterlyRevenue = { labels: quarterlyLabelsInc, values: tempQuarterlyIncome.datasets[0]?.values || [] };
      } else {
          // Fallback, wenn keine Income-Daten vorhanden sind
          tempAnnualIncome = { labels: [], datasets: [] };
          tempQuarterlyIncome = { labels: [], datasets: [] };
          tempAnnualRevenue = { labels: [], values: [] };
          tempQuarterlyRevenue = { labels: [], values: [] };
      }


      // Verarbeite *alle* EPS Daten
      if (hasEarningsData) {
          const annualEarnings = (earningsData.annualEarnings || []).sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
          const quarterlyEarnings = (earningsData.quarterlyEarnings || []).sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
          // Befülle die *vorher* deklarierten Arrays
          annualLabelsEPS = annualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));
          tempAnnualEPS = {
              labels: annualLabelsEPS,
              values: annualEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0)
          };
          quarterlyLabelsEPS = quarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));
          tempQuarterlyEPS = {
              labels: quarterlyLabelsEPS,
              values: quarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0)
          };
      } else {
           // Setze leere Arrays, wenn keine Daten da sind
           tempAnnualEPS = { labels: [], values: [] };
           tempQuarterlyEPS = { labels: [], values: [] };
           annualLabelsEPS = []; // Sicherstellen, dass sie leer sind
           quarterlyLabelsEPS = [];
       }


      // Verarbeite *alle* FCF Daten
      if (hasCashflowData) {
          const annualCashFlowReports = (cashFlowData.annualReports || []).sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
          const quarterlyCashFlowReports = (cashFlowData.quarterlyReports || []).sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
          // Befülle die *vorher* deklarierten Arrays
          annualLabelsFCF = annualCashFlowReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0,4)));
          tempAnnualFCF = {
              labels: annualLabelsFCF,
              values: annualCashFlowReports.map(report => {
                  const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
                  const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0; // Ist oft negativ
                  return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // Skaliert
              })
          };
           quarterlyLabelsFCF = quarterlyCashFlowReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
           tempQuarterlyFCF = {
              labels: quarterlyLabelsFCF,
              values: quarterlyCashFlowReports.map(report => {
                  const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
                  const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
                  return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // Skaliert
              })
          };
      } else {
          // Setze leere Arrays, wenn keine Daten da sind
          tempAnnualFCF = { labels: [], values: [] };
          tempQuarterlyFCF = { labels: [], values: [] };
          annualLabelsFCF = []; // Sicherstellen, dass sie leer sind
          quarterlyLabelsFCF = [];
      }


      // Trimmen der verarbeiteten MAX-Daten (um Leading Zeros zu entfernen)
      // Verwende die temporären Objekte, die jetzt immer definiert sind
      const finalAnnualRevenue = trimData(tempAnnualRevenue.labels, tempAnnualRevenue.values);
      const finalQuarterlyRevenue = trimData(tempQuarterlyRevenue.labels, tempQuarterlyRevenue.values);
      const finalAnnualEPS = trimData(tempAnnualEPS.labels, tempAnnualEPS.values);
      const finalQuarterlyEPS = trimData(tempQuarterlyEPS.labels, tempQuarterlyEPS.values);
      const finalAnnualFCF = trimData(tempAnnualFCF.labels, tempAnnualFCF.values);
      const finalQuarterlyFCF = trimData(tempQuarterlyFCF.labels, tempQuarterlyFCF.values);
      const finalAnnualIncome = trimMultiData(tempAnnualIncome);
      const finalQuarterlyIncome = trimMultiData(tempQuarterlyIncome);

      // State setzen
      setAnnualData(finalAnnualRevenue);
      setQuarterlyData(finalQuarterlyRevenue);
      setAnnualEPS(finalAnnualEPS);
      setQuarterlyEPS(finalQuarterlyEPS);
      setAnnualFCF(finalAnnualFCF);
      setQuarterlyFCF(finalQuarterlyFCF);
      setAnnualIncomeStatement(finalAnnualIncome);
      setQuarterlyIncomeStatement(finalQuarterlyIncome);
      setChartData(finalAnnualRevenue);

      setProgress(100);

      // --- Update Cache ---
      setCachedData(prev => ({
        ...prev,
        [ticker]: { // Key ist nur noch der Ticker
          annualData: finalAnnualRevenue,
          quarterlyData: finalQuarterlyRevenue,
          annualEPS: finalAnnualEPS,
          quarterlyEPS: finalQuarterlyEPS,
          annualFCF: finalAnnualFCF,
          quarterlyFCF: finalQuarterlyFCF,
          annualIncomeStatement: finalAnnualIncome,
          quarterlyIncomeStatement: finalQuarterlyIncome,
          companyInfo: currentCompanyInfo,
          keyMetrics: currentKeyMetrics,
        },
      }));
    } catch (err: any) {
      // Fehlerbehandlung
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      setError(errorMessage);
      console.error("Fehler in fetchData:", err);
      // Reset States
      setCompanyInfo(null); setKeyMetrics(null); setChartData({ labels: [], values: [] });
      setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
      setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
      setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
      setAnnualIncomeStatement({ labels: [], datasets: [] }); setQuarterlyIncomeStatement({ labels: [], datasets: [] });
    } finally {
      setLoading(false);
    }
  // Nur apiKey als Abhängigkeit für useCallback (cachedData wird intern geprüft)
  }, [apiKey]);

  // Rückgabeobjekt
  return {
      chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF,
      annualIncomeStatement, quarterlyIncomeStatement,
      loading, error, progress, companyInfo, keyMetrics,
      fetchData
  };
}; // Ende des Hooks