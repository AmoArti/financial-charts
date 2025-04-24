// src/hooks/useStockData.ts (Mit Debugging für KeyMetrics-Rohdaten)
import { useState, useCallback } from 'react';
// Importiere Typen und Funktionen aus utils
import { formatQuarter, trimMultiData, MultiDatasetStockData } from '../utils/utils';

// --- Interfaces ---
export interface StockData {
  labels: (string | number)[];
  values: number[];
}
export interface CompanyInfo {
  Name: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string; // Behalte als String, Formatierung in Komponente
  LastSale: string;
}
export interface KeyMetrics {
  peRatio: string | null;
  psRatio: string | null;
  pbRatio: string | null;
  evToEbitda: string | null;
  dividendYield: string | null;
  priceChange: string | null;
  priceChangePercent: string | null;
  isPositiveChange: boolean;
  grossMargin: string | null;
  operatingMargin: string | null;
}
// UseStockDataResult Interface erweitert
interface UseStockDataResult {
  chartData: StockData; // Für Kompatibilität oder spezifische Charts
  annualData: StockData; // Revenue Annual (einzeln)
  quarterlyData: StockData; // Revenue Quarterly (einzeln)
  annualEPS: StockData;
  quarterlyEPS: StockData;
  annualFCF: StockData;
  quarterlyFCF: StockData;
  // NEUE Datenstrukturen für Income Statement Chart
  annualIncomeStatement: MultiDatasetStockData;
  quarterlyIncomeStatement: MultiDatasetStockData;
  // Status und Infos
  loading: boolean;
  error: string | null;
  progress: number;
  companyInfo: CompanyInfo | null;
  keyMetrics: KeyMetrics | null;
  fetchData: (ticker: string, years: number) => void;
}

// --- Helper Functions ---
// Typen für Formatierungsfunktionen leicht verbessert
const formatMetric = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value); // Konvertiere zu String für einheitliche Behandlung
    const num = parseFloat(stringValue);
    // Gebe Original-String zurück, wenn es eine gültige Zahl ist
    return isNaN(num) ? null : stringValue;
};
const formatPercentage = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value).replace('%', ''); // '%' entfernen und zu String konvertieren
    const numValue = parseFloat(stringValue);
    if (isNaN(numValue)) return null;

    // Prüfe, ob Originalwert schon % enthielt oder ob es eine Dezimalzahl ist
    if (String(value).includes('%')) {
        return `${numValue.toFixed(2)}%`; // Bereits Prozent
    } else {
        return `${(numValue * 100).toFixed(2)}%`; // Dezimalzahl zu Prozent
    }
};
const formatPriceChange = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const num = parseFloat(String(value)); // Konvertiere zu String zuerst
    if (isNaN(num)) return null;
    return num.toFixed(2); // Immer 2 Dezimalstellen für Preisänderung
};
const formatMargin = (value: number | null): string | null => {
    if (value === null || isNaN(value) || !isFinite(value)) return null;
    return `${value.toFixed(2)}%`; // Margen immer mit 2 Dezimalstellen
};

// --- The Hook ---
export const useStockData = (): UseStockDataResult => {
  // --- States ---
  const [chartData, setChartData] = useState<StockData>({ labels: [], values: [] });
  const [annualData, setAnnualData] = useState<StockData>({ labels: [], values: [] }); // Revenue Annual
  const [quarterlyData, setQuarterlyData] = useState<StockData>({ labels: [], values: [] }); // Revenue Quarterly
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
  const [cachedData, setCachedData] = useState<{ [key: string]: any }>({});
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  // fetchData Definition
  const fetchData = useCallback(async (ticker: string, years: number) => {
    if (!apiKey) { setError('API-Schlüssel nicht gefunden...'); return; }

    const cacheKey = `${ticker}-${years}`;
    // Cache prüfen (inklusive der neuen Daten)
    if (cachedData[cacheKey] && cachedData[cacheKey].fetchedYears >= years) { // Prüfe auch ob genug Jahre im Cache sind
       console.log(`Using cached data for ${ticker} (${cachedData[cacheKey].fetchedYears} years)`);
       const cached = cachedData[cacheKey];
       setAnnualData({ labels: cached.annualLabels || [], values: cached.annualValues || [] });
       setQuarterlyData({ labels: cached.quarterlyLabels || [], values: cached.quarterlyValues || [] });
       setAnnualEPS({ labels: cached.annualEPSLabels || [], values: cached.annualEPSValues || [] });
       setQuarterlyEPS({ labels: cached.quarterlyEPSLabels || [], values: cached.quarterlyEPSValues || [] });
       setAnnualFCF({ labels: cached.annualFCFLabels || [], values: cached.annualFCFValues || [] });
       setQuarterlyFCF({ labels: cached.quarterlyFCFLabels || [], values: cached.quarterlyFCFValues || [] });
       // Setze neue States aus Cache
       setAnnualIncomeStatement(cached.annualIncomeStatement || { labels: [], datasets: [] });
       setQuarterlyIncomeStatement(cached.quarterlyIncomeStatement || { labels: [], datasets: [] });
       // Restliche States
       setChartData({ labels: cached.annualLabels || [], values: cached.annualValues || [] });
       setCompanyInfo(cached.companyInfo || null);
       setKeyMetrics(cached.keyMetrics || null);
       setProgress(100); // Setze Progress auf 100 bei Cache-Nutzung
       setLoading(false); // Sicherstellen, dass Loading false ist
       return;
    }

    // Reset States bei neuem Fetch (Cache nicht getroffen oder nicht genug Jahre)
    setLoading(true); setError(null); setProgress(0);
    setCompanyInfo(null); setKeyMetrics(null);
    setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
    setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
    setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
    setAnnualIncomeStatement({ labels: [], datasets: [] }); setQuarterlyIncomeStatement({ labels: [], datasets: [] });
    setChartData({ labels: [], values: [] });


    try {
      setProgress(10);
      // API Calls...
      console.log(`Fetching new data from API for ${ticker} (${years} years)`);
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
      if (incomeData['Note']) { console.warn(`API-Limit Note: INCOME_STATEMENT – ${incomeData['Note']}`); /* Weiter machen statt Fehler werfen? */ }
      if (earningsData['Error Message']) { throw new Error(`API-Fehler bei EARNINGS: ${earningsData['Error Message']}`); }
      if (earningsData['Note']) { console.warn(`API-Limit Note: EARNINGS – ${earningsData['Note']}`); }
      if (cashFlowData['Error Message']) { throw new Error(`API-Fehler bei CASH_FLOW: ${cashFlowData['Error Message']}`); }
      if (cashFlowData['Note']) { console.warn(`API-Limit Note: CASH_FLOW – ${cashFlowData['Note']}`); }
      if (overviewData['Error Message']) { throw new Error(`API-Fehler bei OVERVIEW: ${overviewData['Error Message']}`); }
      if (overviewData['Note']) { console.warn(`API-Limit Note: OVERVIEW – ${overviewData['Note']}`); }
      if (!overviewData?.Symbol) { throw new Error('Keine Unternehmensinformationen (OVERVIEW) für diesen Ticker verfügbar.'); } // Check Symbol instead of Name for existence
      if (quoteData['Error Message']) { throw new Error(`API-Fehler bei GLOBAL_QUOTE: ${quoteData['Error Message']}`); }
      if (quoteData['Note']) { console.warn(`API-Limit Note: GLOBAL_QUOTE – ${quoteData['Note']}`); }
      const globalQuotePrice = quoteData?.['Global Quote']?.['05. price'];
      if (!globalQuotePrice) { console.warn('Kein aktueller Aktienkurs (GLOBAL_QUOTE) für diesen Ticker verfügbar.'); /* Evtl. nicht als harten Fehler behandeln? */ }
      if (!hasIncomeData && !hasEarningsData && !hasCashflowData) { throw new Error('Keine Finanzdaten (Income, Earnings, Cashflow) für diesen Ticker verfügbar.');}


      // Company Info setzen...
      const currentCompanyInfo: CompanyInfo = {
        Name: overviewData.Name || ticker, // Fallback auf Ticker, falls Name fehlt
        Industry: overviewData.Industry || 'N/A',
        Address: overviewData.Address || 'N/A',
        MarketCapitalization: overviewData.MarketCapitalization || 'N/A',
        LastSale: globalQuotePrice ? parseFloat(globalQuotePrice).toFixed(2) : 'N/A', // Handle missing price
      };
      setCompanyInfo(currentCompanyInfo);

      // --- Key Metrics extrahieren (mit Debugging) ---
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

      // *** HIER Debugging hinzufügen ***
      console.log('DEBUG: Raw key metric inputs from API:');
      console.log(`  overviewData.PERatio (${typeof overviewData.PERatio}):`, overviewData.PERatio);
      console.log(`  overviewData.PriceToSalesRatioTTM (${typeof overviewData.PriceToSalesRatioTTM}):`, overviewData.PriceToSalesRatioTTM);
      console.log(`  overviewData.PriceToBookRatio (${typeof overviewData.PriceToBookRatio}):`, overviewData.PriceToBookRatio);
      console.log(`  overviewData.EVToEBITDA (${typeof overviewData.EVToEBITDA}):`, overviewData.EVToEBITDA);
      console.log(`  overviewData.DividendYield (${typeof overviewData.DividendYield}):`, overviewData.DividendYield);
      console.log(`  quoteData Change (${typeof rawChange}):`, rawChange);
      console.log(`  quoteData Change % (${typeof rawChangePercent}):`, rawChangePercent);
      console.log(`  calculatedGrossMargin (${typeof calculatedGrossMargin}):`, calculatedGrossMargin);
      console.log(`  calculatedOperatingMargin (${typeof calculatedOperatingMargin}):`, calculatedOperatingMargin);
      // *** Ende Debugging ***

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
      console.log('DEBUG: Calculated keyMetrics object:', currentKeyMetrics); // Logge das Ergebnis
      setKeyMetrics(currentKeyMetrics);

      // --- Datenverarbeitung für Charts ---
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1;
      const availableYears = Array.from({ length: years }, (_, i) => startYear + i);
      const numQuarters = years * 4;
      const startDate = new Date(`${startYear}-01-01`);

      const parseAndScale = (value: string | undefined | null): number => {
         if (value === undefined || value === null || value === "None") return 0;
         const num = parseFloat(value);
         return isNaN(num) ? 0 : num / 1e9;
      };

      let annualRevenue: number[] = []; let quarterlyLabelsRevenue: string[] = []; let quarterlyRevenue: number[] = [];
      let annualEPSValues: number[] = []; let quarterlyLabelsEPS: string[] = []; let quarterlyEPSValues: number[] = [];
      let annualFCFValues: number[] = []; let quarterlyLabelsFCF: string[] = []; let quarterlyFCFValues: number[] = [];
      let processedAnnualIncome: MultiDatasetStockData = { labels: [], datasets: [] };
      let processedQuarterlyIncome: MultiDatasetStockData = { labels: [], datasets: [] };

      // Einkommensdaten verarbeiten
      if (hasIncomeData) {
          const annualReportsRaw = incomeData.annualReports || [];
          const quarterlyReportsRaw = incomeData.quarterlyReports || [];

          // Filtern nach Jahren / Datum direkt hier
           const annualReports = annualReportsRaw.filter((r: any) => r?.fiscalDateEnding && parseInt(r.fiscalDateEnding.substring(0, 4)) >= startYear)
                                              .sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4))); // Sortiere nach Jahr aufsteigend

           const quarterlyReports = quarterlyReportsRaw.filter((r: any) => r?.fiscalDateEnding && new Date(r.fiscalDateEnding) >= startDate)
                                                  .sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()) // Sortiere nach Datum aufsteigend
                                                  .slice(-numQuarters); // Nimm die letzten N Quartale

          const annualLabels = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
          processedAnnualIncome = {
              labels: annualLabels,
              datasets: [
                  { label: 'Revenue', values: annualReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                  { label: 'Gross Profit', values: annualReports.map((r: any) => parseAndScale(r.grossProfit)) },
                  { label: 'Operating Income', values: annualReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                  { label: 'Net Income', values: annualReports.map((r: any) => parseAndScale(r.netIncome)) },
              ]
          };
          annualRevenue = processedAnnualIncome.datasets[0]?.values || [];

          processedQuarterlyIncome = {
              labels: quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding)),
              datasets: [
                  { label: 'Revenue', values: quarterlyReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                  { label: 'Gross Profit', values: quarterlyReports.map((r: any) => parseAndScale(r.grossProfit)) },
                  { label: 'Operating Income', values: quarterlyReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                  { label: 'Net Income', values: quarterlyReports.map((r: any) => parseAndScale(r.netIncome)) },
              ]
          };
           quarterlyLabelsRevenue = processedQuarterlyIncome.labels;
           quarterlyRevenue = processedQuarterlyIncome.datasets[0]?.values || [];
      }

       // EPS Daten verarbeiten
       if (hasEarningsData) {
           const annualEarnings = (earningsData.annualEarnings || []).filter((e: any) => e?.fiscalDateEnding && parseInt(e.fiscalDateEnding.substring(0, 4)) >= startYear)
                                                                     .sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
           const quarterlyEarnings = (earningsData.quarterlyEarnings || []).filter((e: any) => e?.fiscalDateEnding && new Date(e.fiscalDateEnding) >= startDate)
                                                                          .sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime())
                                                                          .slice(-numQuarters);

           const annualLabelsEPS = annualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));
           // Sicherstellen, dass EPS-Werte für alle `availableYears` vorhanden sind (ggf. mit 0 füllen)
           annualEPSValues = availableYears.map(year => {
               const report = annualEarnings.find((e:any) => parseInt(e.fiscalDateEnding.substring(0,4)) === year);
               return report ? parseFloat(report.reportedEPS) || 0 : 0;
           });

           quarterlyLabelsEPS = quarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));
           quarterlyEPSValues = quarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
       }

       // FCF Daten verarbeiten
       if (hasCashflowData) {
           const annualCashFlowReports = (cashFlowData.annualReports || []).filter((r: any) => r?.fiscalDateEnding && parseInt(r.fiscalDateEnding.substring(0, 4)) >= startYear)
                                                                           .sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
           const quarterlyCashFlowReports = (cashFlowData.quarterlyReports || []).filter((r: any) => r?.fiscalDateEnding && new Date(r.fiscalDateEnding) >= startDate)
                                                                                 .sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime())
                                                                                 .slice(-numQuarters);

            // Sicherstellen, dass FCF-Werte für alle `availableYears` vorhanden sind
            annualFCFValues = availableYears.map(year => {
                const report = annualCashFlowReports.find((r: any) => parseInt(r.fiscalDateEnding.substring(0,4)) === year);
                 if (report) {
                     const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
                     const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0; // Ist oft negativ
                     return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // FCF = OpCF - CapEx (CapEx als positiver Wert abziehen)
                 }
                 return 0;
            });

           quarterlyLabelsFCF = quarterlyCashFlowReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
           quarterlyFCFValues = quarterlyCashFlowReports.map((report: any) => {
             const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
             const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
             return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9;
           });
       }

      // TrimData Funktion für einzelne Datensätze
      const trimData = (labels: (string | number)[], values: number[]) => {
        const firstNonZeroIndex = values.findIndex(value => value !== 0);
        if (firstNonZeroIndex === -1 || values.length === 0) return { labels: [], values: [] }; // Zusätzliche Prüfung
        return { labels: labels.slice(firstNonZeroIndex), values: values.slice(firstNonZeroIndex) };
      };

      // Trimmen der einzelnen Chart-Daten
      // Wichtig: Labels müssen mit den Werten übereinstimmen, die getrimmt werden!
      const trimmedAnnualRevenue = trimData(availableYears, annualRevenue); // availableYears als Basis für Annual
      const trimmedQuarterlyRevenue = trimData(quarterlyLabelsRevenue, quarterlyRevenue);
      const trimmedAnnualEPS = trimData(availableYears, annualEPSValues);
      const trimmedQuarterlyEPS = trimData(quarterlyLabelsEPS, quarterlyEPSValues);
      const trimmedAnnualFCF = trimData(availableYears, annualFCFValues);
      const trimmedQuarterlyFCF = trimData(quarterlyLabelsFCF, quarterlyFCFValues);

      // Trimmen der Multi-Dataset Income Daten
      const trimmedAnnualIncome = trimMultiData(processedAnnualIncome);
      const trimmedQuarterlyIncome = trimMultiData(processedQuarterlyIncome);

      // State für Chart-Daten setzen
      setAnnualData(trimmedAnnualRevenue);
      setQuarterlyData(trimmedQuarterlyRevenue);
      setAnnualEPS(trimmedAnnualEPS);
      setQuarterlyEPS(trimmedQuarterlyEPS);
      setAnnualFCF(trimmedAnnualFCF);
      setQuarterlyFCF(trimmedQuarterlyFCF);
      setAnnualIncomeStatement(trimmedAnnualIncome);
      setQuarterlyIncomeStatement(trimmedQuarterlyIncome);
      setChartData(trimmedAnnualRevenue); // Setze Hauptchart z.B. auf Revenue

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
          annualIncomeStatement: trimmedAnnualIncome,
          quarterlyIncomeStatement: trimmedQuarterlyIncome,
          companyInfo: currentCompanyInfo,
          keyMetrics: currentKeyMetrics,
          fetchedYears: years // Wichtig für Cache-Vergleich
        },
      }));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
      console.error("Fehler in fetchData:", err);
      // Reset aller States bei Fehler
      setCompanyInfo(null); setKeyMetrics(null); setChartData({ labels: [], values: [] });
      setAnnualData({ labels: [], values: [] }); setQuarterlyData({ labels: [], values: [] });
      setAnnualEPS({ labels: [], values: [] }); setQuarterlyEPS({ labels: [], values: [] });
      setAnnualFCF({ labels: [], values: [] }); setQuarterlyFCF({ labels: [], values: [] });
      setAnnualIncomeStatement({ labels: [], datasets: [] }); setQuarterlyIncomeStatement({ labels: [], datasets: [] });
    } finally {
      setLoading(false);
    }
  // Entferne cachedData wieder aus Deps, Caching-Logik prüft den State direkt
  }, [apiKey]);

  // Rückgabeobjekt erweitert
  return {
      chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF,
      annualIncomeStatement, quarterlyIncomeStatement, // NEU
      loading, error, progress, companyInfo, keyMetrics, fetchData
  };
}; // Ende des Hooks