// src/hooks/useStockData.ts
import { useState, useCallback } from 'react';
import { formatQuarter } from '../utils/utils'; // Stelle sicher, dass der Importpfad stimmt

// --- Interfaces ---
export interface StockData {
  labels: (string | number)[];
  values: number[];
}
export interface CompanyInfo {
  Name: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string;
  LastSale: string;
}
// Interface für Key Metrics (inkl. Margen)
export interface KeyMetrics {
  peRatio: string | null;
  psRatio: string | null;
  pbRatio: string | null;
  evToEbitda: string | null;
  dividendYield: string | null; // Formatierter Prozentwert (%)
  priceChange: string | null;  // Formatierte Preisänderung ($)
  priceChangePercent: string | null; // Formatierter Prozentwert (%) der Änderung
  isPositiveChange: boolean; // Für Farbcodierung
  grossMargin: string | null; // NEU: Bruttomarge (%)
  operatingMargin: string | null; // NEU: Operative Marge (%)
}
// UseStockDataResult Interface (inkl. keyMetrics)
interface UseStockDataResult {
  chartData: StockData; // Evtl. umbenennen oder entfernen, wenn nicht genutzt
  annualData: StockData;
  quarterlyData: StockData;
  annualEPS: StockData;
  quarterlyEPS: StockData;
  annualFCF: StockData;
  quarterlyFCF: StockData;
  loading: boolean;
  error: string | null;
  progress: number;
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null; // NEU HINZUGEFÜGT
  fetchData: (ticker: string, years: number) => void;
}

// --- Helper Functions ---
const formatMetric = (value: any): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const num = parseFloat(value); return isNaN(num) ? null : value.toString();
};
const formatPercentage = (value: any): string | null => {
    const num = parseFloat(value); if (value === undefined || value === null || value === "None" || value === "-" || isNaN(num)) return null;
    const numValue = parseFloat(value.toString().replace('%','')); if(isNaN(numValue)) return null;
    if(value.toString().includes('%')) return `${numValue.toFixed(2)}%`;
    else return `${(numValue * 100).toFixed(2)}%`;
};
const formatPriceChange = (value: any): string | null => {
    const num = parseFloat(value); if (value === undefined || value === null || value === "None" || value === "-" || isNaN(num)) return null;
    return num.toFixed(2);
};
const formatMargin = (value: number | null): string | null => {
    if (value === null || isNaN(value) || !isFinite(value)) return null;
    return `${value.toFixed(2)}%`;
};

export const useStockData = (): UseStockDataResult => {
  // --- States ---
  const [chartData, setChartData] = useState<StockData>({ labels: [], values: [] });
  const [annualData, setAnnualData] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyData, setQuarterlyData] = useState<StockData>({ labels: [], values: [] });
  const [annualEPS, setAnnualEPS] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>({ labels: [], values: [] });
  const [annualFCF, setAnnualFCF] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyFCF, setQuarterlyFCF] = useState<StockData>({ labels: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  // Dein funktionierender In-Memory Cache
  const [cachedData, setCachedData] = useState<{ [key: string]: any }>({});
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  // Dein funktionierender fetchData Kern
  const fetchData = useCallback(async (ticker: string, years: number) => {
    if (!apiKey) {
      setError('API-Schlüssel nicht gefunden. Bitte überprüfe die .env-Datei.');
      return;
    }

    const cacheKey = `${ticker}-${years}`;
    if (cachedData[cacheKey]) {
       console.log(`Using cached data for ${ticker} (${years} years)`);
       const cached = cachedData[cacheKey];
       // Lade alles aus Cache (inkl. keyMetrics)
       setAnnualData({ labels: cached.annualLabels, values: cached.annualValues });
       setQuarterlyData({ labels: cached.quarterlyLabels, values: cached.quarterlyValues });
       setAnnualEPS({ labels: cached.annualEPSLabels, values: cached.annualEPSValues });
       setQuarterlyEPS({ labels: cached.quarterlyEPSLabels, values: cached.quarterlyEPSValues });
       setAnnualFCF({ labels: cached.annualFCFLabels, values: cached.annualFCFValues });
       setQuarterlyFCF({ labels: cached.quarterlyFCFLabels, values: cached.quarterlyFCFValues });
       setChartData({ labels: cached.annualLabels, values: cached.annualValues });
       setCompanyInfo(cached.companyInfo);
       setKeyMetrics(cached.keyMetrics || null); // Lade KeyMetrics
       setProgress(100);
       return;
    }

    setLoading(true); setError(null); setProgress(0);
    setCompanyInfo(null); setKeyMetrics(null);

    try {
      setProgress(10);
      // API Calls...
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

      // Fehlerprüfungen...
      let hasCashflowData = !!(cashFlowData?.annualReports || cashFlowData?.quarterlyReports);
      let hasIncomeData = !!(incomeData?.annualReports || incomeData?.quarterlyReports);
      let hasEarningsData = !!(earningsData?.annualEarnings || earningsData?.quarterlyEarnings);

      if (incomeData['Error Message']) { throw new Error(`API-Fehler bei INCOME_STATEMENT: ${incomeData['Error Message']}`); }
      if (incomeData['Note']) { throw new Error(`API-Limit erreicht: INCOME_STATEMENT – ${incomeData['Note']}`); }
      if (earningsData['Error Message']) { throw new Error(`API-Fehler bei EARNINGS: ${earningsData['Error Message']}`); }
      if (earningsData['Note']) { throw new Error(`API-Limit erreicht: EARNINGS – ${earningsData['Note']}`); }
      if (cashFlowData['Error Message']) { throw new Error(`API-Fehler bei CASH_FLOW: ${cashFlowData['Error Message']}`); }
      if (cashFlowData['Note']) { throw new Error(`API-Limit erreicht: CASH_FLOW – ${cashFlowData['Note']}`); }
      if (overviewData['Error Message']) { throw new Error(`API-Fehler bei OVERVIEW: ${overviewData['Error Message']}`); }
      if (overviewData['Note']) { throw new Error(`API-Limit erreicht: OVERVIEW – ${overviewData['Note']}`); }
      if (!overviewData?.Name) { throw new Error('Keine Unternehmensinformationen für diesen Ticker verfügbar.'); }
      if (quoteData['Error Message']) { throw new Error(`API-Fehler bei GLOBAL_QUOTE: ${quoteData['Error Message']}`); }
      if (quoteData['Note']) { throw new Error(`API-Limit erreicht: GLOBAL_QUOTE – ${quoteData['Note']}`); }
      const globalQuotePrice = quoteData?.['Global Quote']?.['05. price'];
      if (!globalQuotePrice) { throw new Error('Kein aktueller Aktienkurs für diesen Ticker verfügbar.'); }
      if (!hasIncomeData && !hasEarningsData && !hasCashflowData) { throw new Error('Keine Finanzdaten für diesen Ticker verfügbar.');}


      // Company Info setzen...
      const currentCompanyInfo = {
        Name: overviewData.Name, // Sicher nach Prüfung oben
        Industry: overviewData.Industry || 'N/A',
        Address: overviewData.Address || 'N/A',
        MarketCapitalization: overviewData.MarketCapitalization || 'N/A',
        LastSale: parseFloat(globalQuotePrice).toFixed(2), // Sicher nach Prüfung oben
      };
      setCompanyInfo(currentCompanyInfo);

      // Key Metrics extrahieren (inkl. Margen)...
      let calculatedGrossMargin: number | null = null; let calculatedOperatingMargin: number | null = null;
      if (hasIncomeData) {
        const latestAnnualIncomeReport = incomeData.annualReports?.[0];
        if (latestAnnualIncomeReport) {
            const totalRevenue = parseFloat(latestAnnualIncomeReport.totalRevenue) || 0;
            if (totalRevenue > 0) {
                calculatedGrossMargin = ((parseFloat(latestAnnualIncomeReport.grossProfit) || 0) / totalRevenue) * 100;
                calculatedOperatingMargin = ((parseFloat(latestAnnualIncomeReport.operatingIncome) || 0) / totalRevenue) * 100;
            }
        }
      }
      const rawChange = quoteData['Global Quote']?.['09. change']; const numChange = parseFloat(rawChange || '');
      const currentKeyMetrics: KeyMetrics = {
         peRatio: formatMetric(overviewData.PERatio), psRatio: formatMetric(overviewData.PriceToSalesRatioTTM), pbRatio: formatMetric(overviewData.PriceToBookRatio),
         evToEbitda: formatMetric(overviewData.EVToEBITDA), dividendYield: formatPercentage(overviewData.DividendYield), priceChange: formatPriceChange(rawChange),
         priceChangePercent: formatPercentage(quoteData['Global Quote']?.['10. change percent']), isPositiveChange: !isNaN(numChange) && numChange >= 0,
         grossMargin: formatMargin(calculatedGrossMargin), operatingMargin: formatMargin(calculatedOperatingMargin)
      };
      setKeyMetrics(currentKeyMetrics);

      // --- Datenverarbeitung für Charts ---
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1;
      const availableYears = Array.from({ length: years }, (_, i) => startYear + i);
      const numQuarters = years * 4;
      const startDate = new Date(`${startYear}-01-01`);

      // Umsatzdaten...
      let annualRevenue: number[] = [];
      let quarterlyLabels: string[] = [];
      let quarterlyRevenue: number[] = [];
      if (hasIncomeData) {
          const annualReports = incomeData.annualReports || [];
          annualRevenue = availableYears.map(year => { const r = annualReports.find(report => parseInt(report.fiscalDateEnding?.split('-')[0] || '0') === year); return r ? parseFloat(r.totalRevenue) / 1e9 || 0 : 0; });
          const quarterlyReports = incomeData.quarterlyReports || [];
          const filteredQuarterlyReports = quarterlyReports.filter(r => r?.fiscalDateEnding && new Date(r.fiscalDateEnding) >= startDate);
          quarterlyLabels = filteredQuarterlyReports.map(r => formatQuarter(r.fiscalDateEnding)).slice(0, numQuarters).reverse();
          quarterlyRevenue = filteredQuarterlyReports.map(r => parseFloat(r.totalRevenue) / 1e9 || 0).slice(0, numQuarters).reverse();
      }

      // EPS-Daten...
      let annualEPSValues: number[] = [];
      let quarterlyEPSLabels: string[] = [];
      let quarterlyEPSValues: number[] = [];
      if (hasEarningsData) {
          const annualEarnings = earningsData.annualEarnings || [];
          annualEPSValues = availableYears.map(year => { const e = annualEarnings.find(earning => parseInt(earning.fiscalDateEnding?.split('-')[0] || '0') === year); return e ? parseFloat(e.reportedEPS) || 0 : 0; });
          const quarterlyEarnings = earningsData.quarterlyEarnings || [];
          const filteredQuarterlyEarnings = quarterlyEarnings.filter(e => e?.fiscalDateEnding && new Date(e.fiscalDateEnding) >= startDate);
          quarterlyEPSLabels = filteredQuarterlyEarnings.map(e => formatQuarter(e.fiscalDateEnding)).slice(0, numQuarters).reverse();
          quarterlyEPSValues = filteredQuarterlyEarnings.map(e => parseFloat(e.reportedEPS) || 0).slice(0, numQuarters).reverse();
      }

      // FCF-Daten mit Korrektur
      let annualFCFValues: number[] = [];
      let quarterlyFCFValues: number[] = [];
      let quarterlyFCFLabels: string[] = [];
      if (hasCashflowData) {
          const annualCashFlowReports = cashFlowData.annualReports || [];
          annualFCFValues = availableYears.map(year => {
            const report = annualCashFlowReports.find(r => {
                if (r && typeof r.fiscalDateEnding === 'string') {
                    const reportYear = parseInt(r.fiscalDateEnding.split('-')[0]);
                    return !isNaN(reportYear) && reportYear === year;
                } return false;
            });
            if (report) {
              const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
              const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
              return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9;
            } return 0;
          });

          const quarterlyCashFlowReports = cashFlowData.quarterlyReports || [];
          const filteredQuarterlyCashFlowReports = quarterlyCashFlowReports.filter(r => r?.fiscalDateEnding && new Date(r.fiscalDateEnding) >= startDate);
          quarterlyFCFLabels = filteredQuarterlyCashFlowReports.map(r => formatQuarter(r.fiscalDateEnding)).slice(0, numQuarters).reverse();
          quarterlyFCFValues = filteredQuarterlyCashFlowReports.map(report => {
            const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
            const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
            return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9;
          }).slice(0, numQuarters).reverse();
      }

      // TrimData Funktion (deine Version)
      const trimData = (labels: (string | number)[], values: number[]) => {
        const firstNonZeroIndex = values.findIndex(value => value !== 0);
        if (firstNonZeroIndex === -1) return { labels: [], values: [] };
        return { labels: labels.slice(firstNonZeroIndex), values: values.slice(firstNonZeroIndex) };
      };

      // Trimmen der Chart-Daten
      const trimmedAnnualRevenue = trimData(availableYears, annualRevenue);
      const trimmedAnnualEPS = trimData(availableYears, annualEPSValues);
      const trimmedAnnualFCF = trimData(availableYears, annualFCFValues);
      const trimmedQuarterlyRevenue = trimData(quarterlyLabels, quarterlyRevenue);
      const trimmedQuarterlyEPS = trimData(quarterlyEPSLabels, quarterlyEPSValues);
      const trimmedQuarterlyFCF = trimData(quarterlyFCFLabels, quarterlyFCFValues);

      // State für Chart-Daten setzen
      setAnnualData({ labels: trimmedAnnualRevenue.labels, values: trimmedAnnualRevenue.values });
      setQuarterlyData({ labels: trimmedQuarterlyRevenue.labels, values: trimmedQuarterlyRevenue.values });
      setAnnualEPS({ labels: trimmedAnnualEPS.labels, values: trimmedAnnualEPS.values });
      setQuarterlyEPS({ labels: trimmedQuarterlyEPS.labels, values: trimmedQuarterlyEPS.values });
      setAnnualFCF({ labels: trimmedAnnualFCF.labels, values: trimmedAnnualFCF.values });
      setQuarterlyFCF({ labels: trimmedQuarterlyFCF.labels, values: trimmedQuarterlyFCF.values });
      setChartData({ labels: trimmedAnnualRevenue.labels, values: trimmedAnnualRevenue.values });

      setProgress(100);

      // --- Update Cache ---
      setCachedData(prev => ({
        ...prev,
        [cacheKey]: {
          annualLabels: trimmedAnnualRevenue.labels, annualValues: trimmedAnnualRevenue.values,
          quarterlyLabels: trimmedQuarterlyRevenue.labels, quarterlyValues: trimmedQuarterlyRevenue.values,
          annualEPSLabels: trimmedAnnualEPS.labels, annualEPSValues: trimmedAnnualEPS.values,
          quarterlyEPSLabels: trimmedQuarterlyEPS.labels, quarterlyEPSValues: trimmedQuarterlyEPS.values,
          annualFCFLabels: trimmedAnnualFCF.labels, annualFCFValues: trimmedAnnualFCF.values,
          quarterlyFCFLabels: trimmedQuarterlyFCF.labels, quarterlyFCFValues: trimmedQuarterlyFCF.values,
          companyInfo: currentCompanyInfo,
          keyMetrics: currentKeyMetrics
        },
      }));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
      console.error(err);
      // Reset States bei Fehler
      setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
      setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
      setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
      setCompanyInfo(null); setKeyMetrics(null);
    } finally {
      setLoading(false);
    }
    // Alte Abhängigkeiten beibehalten
  }, [apiKey, cachedData]);

  // Rückgabeobjekt
  return { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, keyMetrics, fetchData };
}; // Ende des Hooks