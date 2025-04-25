// src/hooks/useStockData.ts (Fix: TypeError reading 'gm' of undefined)
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
// UseStockDataResult Interface erweitert
interface UseStockDataResult {
  chartData: StockData;
  annualData: StockData; quarterlyData: StockData; // Revenue
  annualEPS: StockData; quarterlyEPS: StockData;
  annualFCF: StockData; quarterlyFCF: StockData;
  annualIncomeStatement: MultiDatasetStockData; quarterlyIncomeStatement: MultiDatasetStockData;
  annualMargins: MultiDatasetStockData; quarterlyMargins: MultiDatasetStockData; // Margen
  loading: boolean; error: string | null; progress: number;
  companyInfo: CompanyInfo | null; keyMetrics: KeyMetrics | null;
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
const formatMargin = (value: number | null): string | null => { // Wird für KeyMetrics genutzt
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
    // Prüfe auch auf Längenungleichheit
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
  const [annualMargins, setAnnualMargins] = useState<MultiDatasetStockData>({ labels: [], datasets: [] });
  const [quarterlyMargins, setQuarterlyMargins] = useState<MultiDatasetStockData>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [cachedData, setCachedData] = useState<{ [ticker: string]: any }>({}); // Key ist Ticker
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  // fetchData Definition - ohne 'years' Parameter
  const fetchData = useCallback(async (ticker: string) => {
    if (!apiKey) { setError('API-Schlüssel nicht gefunden...'); setLoading(false); return; }

    // Cache prüfen (nur nach Ticker)
    if (cachedData[ticker]) {
       console.log(`Using cached data for ${ticker}`);
       const cached = cachedData[ticker];
       // Alle States aus Cache setzen (inkl. Margen)
       setAnnualData(cached.annualData || { labels: [], values: [] });
       setQuarterlyData(cached.quarterlyData || { labels: [], values: [] });
       setAnnualEPS(cached.annualEPS || { labels: [], values: [] });
       setQuarterlyEPS(cached.quarterlyEPS || { labels: [], values: [] });
       setAnnualFCF(cached.annualFCF || { labels: [], values: [] });
       setQuarterlyFCF(cached.quarterlyFCF || { labels: [], values: [] });
       setAnnualIncomeStatement(cached.annualIncomeStatement || { labels: [], datasets: [] });
       setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement || { labels: [], datasets: [] });
       setAnnualMargins(cached.annualMargins || { labels: [], datasets: [] });
       setQuarterlyMargins(cached.quarterlyMargins || { labels: [], datasets: [] });
       setChartData(cached.chartData || { labels: [], values: [] });
       setCompanyInfo(cached.companyInfo || null);
       setKeyMetrics(cached.keyMetrics || null);
       setProgress(100); setError(null); setLoading(false);
       return;
    }

    // Reset States bei neuem Fetch
    console.log(`Fetching new data from API for ${ticker} (MAX available)`);
    setLoading(true); setError(null); setProgress(0);
    setCompanyInfo(null); setKeyMetrics(null);
    setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
    setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
    setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
    setAnnualIncomeStatement({ labels: [], datasets: [] }); setQuarterlyIncomeStatement({ labels: [], datasets: [] });
    setAnnualMargins({ labels: [], datasets: [] }); setQuarterlyMargins({ labels: [], datasets: [] });
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

      // ... (alle Fehlerprüfungen wie vorher, ggf. mit console.warn statt throw für Limits) ...
       if (!overviewData?.Symbol) { throw new Error('Keine Unternehmensinformationen (OVERVIEW) für diesen Ticker verfügbar.'); }
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
      let calculatedGrossMarginKM: number | null = null;
      let calculatedOperatingMarginKM: number | null = null;
      if (hasIncomeData && incomeData.annualReports && incomeData.annualReports.length > 0) {
        const latestAnnualIncomeReport = incomeData.annualReports[0];
        if (latestAnnualIncomeReport) {
            const totalRevenue = parseFloat(latestAnnualIncomeReport.totalRevenue) || 0;
            if (totalRevenue > 0) {
                const grossProfit = parseFloat(latestAnnualIncomeReport.grossProfit) || 0;
                const operatingIncome = parseFloat(latestAnnualIncomeReport.operatingIncome) || 0;
                calculatedGrossMarginKM = (grossProfit / totalRevenue) * 100;
                calculatedOperatingMarginKM = (operatingIncome / totalRevenue) * 100;
            }
        }
      }
      const rawChange = quoteData?.['Global Quote']?.['09. change'];
      const rawChangePercent = quoteData?.['Global Quote']?.['10. change percent'];
      const numChange = parseFloat(rawChange || '');

      // Debugging Logs für Rohdaten (können später entfernt werden)
      console.log('DEBUG: Raw key metric inputs from API:', { /* ... */ });

      const currentKeyMetrics: KeyMetrics = {
         peRatio: formatMetric(overviewData.PERatio), psRatio: formatMetric(overviewData.PriceToSalesRatioTTM),
         pbRatio: formatMetric(overviewData.PriceToBookRatio), evToEbitda: formatMetric(overviewData.EVToEBITDA),
         dividendYield: formatPercentage(overviewData.DividendYield), priceChange: formatPriceChange(rawChange),
         priceChangePercent: formatPercentage(rawChangePercent), isPositiveChange: !isNaN(numChange) && numChange >= 0,
         grossMargin: formatMargin(calculatedGrossMarginKM), operatingMargin: formatMargin(calculatedOperatingMarginKM)
      };
      console.log('DEBUG: Calculated keyMetrics object:', currentKeyMetrics);
      setKeyMetrics(currentKeyMetrics);

      // --- Datenverarbeitung für Charts (MAX Daten verarbeiten) ---
      const parseAndScale = (value: string | undefined | null): number => {
          if (value === undefined || value === null || value === "None") return 0;
          const num = parseFloat(value);
          return isNaN(num) ? 0 : num / 1e9; // Skaliert auf Mrd.
      };

      // Temporäre Variablen
      let tempAnnualRevenue: StockData = { labels: [], values: [] }; let tempQuarterlyRevenue: StockData = { labels: [], values: [] };
      let tempAnnualEPS: StockData = { labels: [], values: [] }; let tempQuarterlyEPS: StockData = { labels: [], values: [] };
      let tempAnnualFCF: StockData = { labels: [], values: [] }; let tempQuarterlyFCF: StockData = { labels: [], values: [] };
      let tempAnnualIncome: MultiDatasetStockData = { labels: [], datasets: [] }; let tempQuarterlyIncome: MultiDatasetStockData = { labels: [], datasets: [] };
      let tempAnnualMargins: MultiDatasetStockData = { labels: [], datasets: [] };
      let tempQuarterlyMargins: MultiDatasetStockData = { labels: [], datasets: [] };
      let annualLabelsEPS: (string | number)[] = []; let quarterlyLabelsEPS: string[] = [];
      let annualLabelsFCF: (string | number)[] = []; let quarterlyLabelsFCF: string[] = [];
      let annualLabelsInc: (string | number)[] = []; let quarterlyLabelsInc: string[] = [];

      // Robustere Margenberechnung
       const calculateMargins = (report: any): { gm: number | null, om: number | null, nm: number | null } => {
            if (!report || typeof report !== 'object') {
                console.warn("calculateMargins received invalid report:", report);
                return { gm: null, om: null, nm: null };
            }
            const revenue = parseFloat(report.totalRevenue);
            if (isNaN(revenue) || revenue === 0) { return { gm: null, om: null, nm: null }; }
            const gp = parseFloat(report.grossProfit); const oi = parseFloat(report.operatingIncome); const ni = parseFloat(report.netIncome);
            return {
                gm: isNaN(gp) ? null : (gp / revenue) * 100,
                om: isNaN(oi) ? null : (oi / revenue) * 100,
                nm: isNaN(ni) ? null : (ni / revenue) * 100,
            };
        };

      // Verarbeite Einkommensdaten
      if (hasIncomeData) {
          const annualReports = (Array.isArray(incomeData.annualReports) ? incomeData.annualReports : []).sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
          const quarterlyReports = (Array.isArray(incomeData.quarterlyReports) ? incomeData.quarterlyReports : []).sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());

          annualLabelsInc = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
          quarterlyLabelsInc = quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));

          const annualMarginsData = annualReports.map(calculateMargins);
          const quarterlyMarginsData = quarterlyReports.map(calculateMargins);

          console.log("DEBUG: annualMarginsData (before map):", JSON.stringify(annualMarginsData));
          console.log("DEBUG: quarterlyMarginsData (before map):", JSON.stringify(quarterlyMarginsData));

          // Income Statement MultiDataset
          tempAnnualIncome = {
              labels: annualLabelsInc,
              datasets: [
                  { label: 'Revenue', values: annualReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                  { label: 'Gross Profit', values: annualReports.map((r: any) => parseAndScale(r.grossProfit)) },
                  { label: 'Operating Income', values: annualReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                  { label: 'Net Income', values: annualReports.map((r: any) => parseAndScale(r.netIncome)) },
              ]
          };
          tempQuarterlyIncome = {
              labels: quarterlyLabelsInc,
              datasets: [
                  { label: 'Revenue', values: quarterlyReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                  { label: 'Gross Profit', values: quarterlyReports.map((r: any) => parseAndScale(r.grossProfit)) },
                  { label: 'Operating Income', values: quarterlyReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                  { label: 'Net Income', values: quarterlyReports.map((r: any) => parseAndScale(r.netIncome)) },
              ]
          };
          tempAnnualRevenue = { labels: annualLabelsInc, values: tempAnnualIncome.datasets[0]?.values || [] };
          tempQuarterlyRevenue = { labels: quarterlyLabelsInc, values: tempQuarterlyIncome.datasets[0]?.values || [] };

          // Margen MultiDataset (mit optional chaining beim Zugriff auf m)
          tempAnnualMargins = {
              labels: annualLabelsInc,
              datasets: [
                  { label: 'Gross Margin', values: annualMarginsData.map(m => m?.gm ?? 0) }, // ?. hinzugefügt
                  { label: 'Operating Margin', values: annualMarginsData.map(m => m?.om ?? 0) }, // ?. hinzugefügt
                  { label: 'Net Income Margin', values: annualMarginsData.map(m => m?.nm ?? 0) }  // ?. hinzugefügt
              ]
          };
          tempQuarterlyMargins = {
              labels: quarterlyLabelsInc,
              datasets: [
                   { label: 'Gross Margin', values: quarterlyMarginsData.map(m => m?.gm ?? 0) }, // ?. hinzugefügt
                   { label: 'Operating Margin', values: quarterlyMarginsData.map(m => m?.om ?? 0) }, // ?. hinzugefügt
                   { label: 'Net Income Margin', values: quarterlyMarginsData.map(m => m?.nm ?? 0) }  // ?. hinzugefügt
              ]
          };
      } else { /* Fallbacks für Income/Revenue/Margins */
          tempAnnualIncome = { labels: [], datasets: [] }; tempQuarterlyIncome = { labels: [], datasets: [] };
          tempAnnualRevenue = { labels: [], values: [] }; tempQuarterlyRevenue = { labels: [], values: [] };
          tempAnnualMargins = { labels: [], datasets: [] }; tempQuarterlyMargins = { labels: [], datasets: [] };
      }

      // Verarbeite EPS Daten
      if (hasEarningsData) {
          const annualEarnings = (Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : []).sort(/*...*/);
          const quarterlyEarnings = (Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : []).sort(/*...*/);
          annualLabelsEPS = annualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));
          tempAnnualEPS = { labels: annualLabelsEPS, values: annualEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0) };
          quarterlyLabelsEPS = quarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));
          tempQuarterlyEPS = { labels: quarterlyLabelsEPS, values: quarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0) };
      } else { /* Fallbacks für EPS */
           tempAnnualEPS = { labels: [], values: [] }; tempQuarterlyEPS = { labels: [], values: [] };
           annualLabelsEPS = []; quarterlyLabelsEPS = [];
       }

      // Verarbeite FCF Daten
      if (hasCashflowData) {
          const annualCashFlowReports = (Array.isArray(cashFlowData.annualReports) ? cashFlowData.annualReports : []).sort(/*...*/);
          const quarterlyCashFlowReports = (Array.isArray(cashFlowData.quarterlyReports) ? cashFlowData.quarterlyReports : []).sort(/*...*/);
          annualLabelsFCF = annualCashFlowReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0,4)));
          tempAnnualFCF = {
              labels: annualLabelsFCF,
              values: annualCashFlowReports.map(report => {
                  const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
                  const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
                  return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9;
              })
          };
           quarterlyLabelsFCF = quarterlyCashFlowReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
           tempQuarterlyFCF = {
              labels: quarterlyLabelsFCF,
              values: quarterlyCashFlowReports.map(report => {
                  const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
                  const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
                  return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9;
              })
          };
      } else { /* Fallbacks für FCF */
          tempAnnualFCF = { labels: [], values: [] }; tempQuarterlyFCF = { labels: [], values: [] };
          annualLabelsFCF = []; quarterlyLabelsFCF = [];
      }

      // Trimmen der verarbeiteten MAX-Daten
      const finalAnnualRevenue = trimData(tempAnnualRevenue.labels, tempAnnualRevenue.values);
      const finalQuarterlyRevenue = trimData(tempQuarterlyRevenue.labels, tempQuarterlyRevenue.values);
      const finalAnnualEPS = trimData(tempAnnualEPS.labels, tempAnnualEPS.values);
      const finalQuarterlyEPS = trimData(tempQuarterlyEPS.labels, tempQuarterlyEPS.values);
      const finalAnnualFCF = trimData(tempAnnualFCF.labels, tempAnnualFCF.values);
      const finalQuarterlyFCF = trimData(tempQuarterlyFCF.labels, tempQuarterlyFCF.values);
      const finalAnnualIncome = trimMultiData(tempAnnualIncome);
      const finalQuarterlyIncome = trimMultiData(tempQuarterlyIncome);
      const finalAnnualMargins = trimMultiData(tempAnnualMargins);
      const finalQuarterlyMargins = trimMultiData(tempQuarterlyMargins);

      // State setzen
      setAnnualData(finalAnnualRevenue); setQuarterlyData(finalQuarterlyRevenue);
      setAnnualEPS(finalAnnualEPS); setQuarterlyEPS(finalQuarterlyEPS);
      setAnnualFCF(finalAnnualFCF); setQuarterlyFCF(finalQuarterlyFCF);
      setAnnualIncomeStatement(finalAnnualIncome); setQuarterlyIncomeStatement(finalQuarterlyIncome);
      setAnnualMargins(finalAnnualMargins); setQuarterlyMargins(finalQuarterlyMargins);
      setChartData(finalAnnualRevenue);

      setProgress(100);

      // --- Update Cache ---
      setCachedData(prev => ({
        ...prev,
        [ticker]: {
          annualData: finalAnnualRevenue, quarterlyData: finalQuarterlyRevenue,
          annualEPS: finalAnnualEPS, quarterlyEPS: finalQuarterlyEPS,
          annualFCF: finalAnnualFCF, quarterlyFCF: finalQuarterlyFCF,
          annualIncomeStatement: finalAnnualIncome, quarterlyIncomeStatement: finalQuarterlyIncome,
          annualMargins: finalAnnualMargins, quarterlyMargins: finalQuarterlyMargins,
          companyInfo: currentCompanyInfo, keyMetrics: currentKeyMetrics,
        },
      }));
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Datenabruf';
      setError(errorMessage);
      console.error("Fehler in fetchData:", err);
      // Reset States
      setCompanyInfo(null); setKeyMetrics(null); setChartData({ labels: [], values: [] });
      setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
      setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
      setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
      setAnnualIncomeStatement({ labels: [], datasets: [] }); setQuarterlyIncomeStatement({ labels: [], datasets: [] });
      setAnnualMargins({ labels: [], datasets: [] }); setQuarterlyMargins({ labels: [], datasets: [] });
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]); // cachedData wieder als Dep hinzugefügt

  // Rückgabeobjekt
  return {
      chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF,
      annualIncomeStatement, quarterlyIncomeStatement,
      annualMargins, quarterlyMargins,
      loading, error, progress, companyInfo, keyMetrics,
      fetchData
  };
}; // Ende des Hooks