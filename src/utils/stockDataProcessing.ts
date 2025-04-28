// src/utils/stockDataProcessing.ts
import {
    StockData,
    CompanyInfo,
    KeyMetrics,
    MultiDatasetStockData,
    RawApiData,
  } from '../types/stockDataTypes';
  import { formatQuarter, trimMultiData } from './utils'; // Importiere Helfer aus utils
  
  // --- Interne Hilfsfunktionen ---
  
  // Skaliert Werte (z.B. auf Mrd. für Charts)
  const parseAndScale = (value: string | undefined | null): number => {
    if (value === undefined || value === null || value === "None" || value === "-") return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num / 1e9; // Skaliert auf Mrd.
  };
  
  // Skaliert Werte ohne "None"-Check für FCF-Berechnung
  const parseFloatOrZero = (value: string | undefined | null): number => {
      if (value === undefined || value === null) return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
  };
  
  
  // Trimmt einzelne Datensätze (Labels + Werte)
  const trimData = (labels: (string | number)[], values: number[]): StockData => {
    if (!Array.isArray(labels) || !Array.isArray(values)) {
      return { labels: [], values: [] };
    }
    const firstNonZeroIndex = values.findIndex(value => value !== 0);
    if (firstNonZeroIndex === -1 || values.length === 0 || labels.length === 0 || labels.length !== values.length) {
      return { labels: [], values: [] };
    }
    return { labels: labels.slice(firstNonZeroIndex), values: values.slice(firstNonZeroIndex) };
  };
  
  
  // Berechnet Margen aus einem Income Statement Report
  const calculateMargins = (report: any): { gm: number | null, om: number | null, nm: number | null } => {
    if (!report || typeof report !== 'object') {
      console.warn("calculateMargins received invalid report:", report);
      return { gm: null, om: null, nm: null };
    }
    const revenue = parseFloat(report.totalRevenue);
    if (isNaN(revenue) || revenue === 0) {
      return { gm: null, om: null, nm: null };
    }
    const gp = parseFloat(report.grossProfit);
    const oi = parseFloat(report.operatingIncome);
    const ni = parseFloat(report.netIncome);
    return {
      gm: isNaN(gp) ? null : (gp / revenue) * 100,
      om: isNaN(oi) ? null : (oi / revenue) * 100,
      nm: isNaN(ni) ? null : (ni / revenue) * 100,
    };
  };
  
  // --- Verarbeitungsfunktionen für spezifische API-Daten ---
  
  const processIncomeData = (incomeData: any): {
    annualRevenue: StockData;
    quarterlyRevenue: StockData;
    annualIncomeStatement: MultiDatasetStockData;
    quarterlyIncomeStatement: MultiDatasetStockData;
    annualMargins: MultiDatasetStockData;
    quarterlyMargins: MultiDatasetStockData;
    latestAnnualGrossMargin: number | null; // Für KeyMetrics
    latestAnnualOperatingMargin: number | null; // Für KeyMetrics
  } => {
    let result = {
        annualRevenue: { labels: [], values: [] } as StockData,
        quarterlyRevenue: { labels: [], values: [] } as StockData,
        annualIncomeStatement: { labels: [], datasets: [] } as MultiDatasetStockData,
        quarterlyIncomeStatement: { labels: [], datasets: [] } as MultiDatasetStockData,
        annualMargins: { labels: [], datasets: [] } as MultiDatasetStockData,
        quarterlyMargins: { labels: [], datasets: [] } as MultiDatasetStockData,
        latestAnnualGrossMargin: null as number | null,
        latestAnnualOperatingMargin: null as number | null,
    };
  
    if (!incomeData || (!incomeData.annualReports && !incomeData.quarterlyReports)) {
      return result; // Keine Daten vorhanden
    }
  
    // Jahresdaten
    const annualReports = (Array.isArray(incomeData.annualReports) ? incomeData.annualReports : [])
       .sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
  
    if(annualReports.length > 0) {
        const annualLabelsInc = annualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
        const annualMarginsData = annualReports.map(calculateMargins);
  
        result.annualIncomeStatement = {
            labels: annualLabelsInc,
            datasets: [
                { label: 'Revenue', values: annualReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                { label: 'Gross Profit', values: annualReports.map((r: any) => parseAndScale(r.grossProfit)) },
                { label: 'Operating Income', values: annualReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                { label: 'Net Income', values: annualReports.map((r: any) => parseAndScale(r.netIncome)) },
            ]
        };
        result.annualMargins = {
             labels: annualLabelsInc,
             datasets: [
                 { label: 'Gross Margin', values: annualMarginsData.map(m => m?.gm ?? 0) },
                 { label: 'Operating Margin', values: annualMarginsData.map(m => m?.om ?? 0) },
                 { label: 'Net Income Margin', values: annualMarginsData.map(m => m?.nm ?? 0) }
             ]
         };
         result.annualRevenue = trimData(annualLabelsInc, result.annualIncomeStatement.datasets[0]?.values || []);
         result.annualIncomeStatement = trimMultiData(result.annualIncomeStatement);
         result.annualMargins = trimMultiData(result.annualMargins);
  
         // Margen für KeyMetrics extrahieren (aus dem letzten Jahresbericht)
         result.latestAnnualGrossMargin = annualMarginsData[annualMarginsData.length - 1]?.gm ?? null;
         result.latestAnnualOperatingMargin = annualMarginsData[annualMarginsData.length - 1]?.om ?? null;
    }
  
  
    // Quartalsdaten
    const quarterlyReports = (Array.isArray(incomeData.quarterlyReports) ? incomeData.quarterlyReports : [])
        .sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  
    if(quarterlyReports.length > 0) {
        const quarterlyLabelsInc = quarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
        const quarterlyMarginsData = quarterlyReports.map(calculateMargins);
  
         result.quarterlyIncomeStatement = {
             labels: quarterlyLabelsInc,
             datasets: [
                 { label: 'Revenue', values: quarterlyReports.map((r: any) => parseAndScale(r.totalRevenue)) },
                 { label: 'Gross Profit', values: quarterlyReports.map((r: any) => parseAndScale(r.grossProfit)) },
                 { label: 'Operating Income', values: quarterlyReports.map((r: any) => parseAndScale(r.operatingIncome)) },
                 { label: 'Net Income', values: quarterlyReports.map((r: any) => parseAndScale(r.netIncome)) },
             ]
         };
         result.quarterlyMargins = {
              labels: quarterlyLabelsInc,
              datasets: [
                  { label: 'Gross Margin', values: quarterlyMarginsData.map(m => m?.gm ?? 0) },
                  { label: 'Operating Margin', values: quarterlyMarginsData.map(m => m?.om ?? 0) },
                  { label: 'Net Income Margin', values: quarterlyMarginsData.map(m => m?.nm ?? 0) }
              ]
          };
          result.quarterlyRevenue = trimData(quarterlyLabelsInc, result.quarterlyIncomeStatement.datasets[0]?.values || []);
          result.quarterlyIncomeStatement = trimMultiData(result.quarterlyIncomeStatement);
          result.quarterlyMargins = trimMultiData(result.quarterlyMargins);
    }
  
    return result;
  };
  
  const processEarningsData = (earningsData: any): {
    annualEPS: StockData;
    quarterlyEPS: StockData;
  } => {
     let result = {
         annualEPS: { labels: [], values: [] } as StockData,
         quarterlyEPS: { labels: [], values: [] } as StockData,
     };
  
     if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
        return result;
     }
  
     // Jahresdaten
     const annualEarnings = (Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [])
        .sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
     if (annualEarnings.length > 0) {
         const annualLabelsEPS = annualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));
         const annualValuesEPS = annualEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
         result.annualEPS = trimData(annualLabelsEPS, annualValuesEPS);
     }
  
     // Quartalsdaten
     const quarterlyEarnings = (Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [])
         .sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
      if(quarterlyEarnings.length > 0) {
          const quarterlyLabelsEPS = quarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));
          const quarterlyValuesEPS = quarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
          result.quarterlyEPS = trimData(quarterlyLabelsEPS, quarterlyValuesEPS);
      }
  
     return result;
  };
  
  const processCashflowData = (cashFlowData: any): {
    annualFCF: StockData;
    quarterlyFCF: StockData;
  } => {
      let result = {
          annualFCF: { labels: [], values: [] } as StockData,
          quarterlyFCF: { labels: [], values: [] } as StockData,
      };
  
       if (!cashFlowData || (!cashFlowData.annualReports && !cashFlowData.quarterlyReports)) {
          return result;
       }
  
       // Jahresdaten
       const annualCashFlowReports = (Array.isArray(cashFlowData.annualReports) ? cashFlowData.annualReports : [])
          .sort((a:any, b:any) => parseInt(a.fiscalDateEnding.substring(0,4)) - parseInt(b.fiscalDateEnding.substring(0,4)));
       if(annualCashFlowReports.length > 0) {
           const annualLabelsFCF = annualCashFlowReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0,4)));
           const annualValuesFCF = annualCashFlowReports.map(report => {
               const operatingCashflow = parseFloatOrZero(report.operatingCashflow);
               const capitalExpenditures = parseFloatOrZero(report.capitalExpenditures);
               // FCF = Operating Cashflow - Capital Expenditures (CapEx ist oft negativ in API)
               return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // Skaliert auf Mrd.
           });
           result.annualFCF = trimData(annualLabelsFCF, annualValuesFCF);
       }
  
       // Quartalsdaten
       const quarterlyCashFlowReports = (Array.isArray(cashFlowData.quarterlyReports) ? cashFlowData.quarterlyReports : [])
           .sort((a:any, b:any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
        if(quarterlyCashFlowReports.length > 0) {
            const quarterlyLabelsFCF = quarterlyCashFlowReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
            const quarterlyValuesFCF = quarterlyCashFlowReports.map(report => {
                 const operatingCashflow = parseFloatOrZero(report.operatingCashflow);
                 const capitalExpenditures = parseFloatOrZero(report.capitalExpenditures);
                 return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // Skaliert auf Mrd.
             });
             result.quarterlyFCF = trimData(quarterlyLabelsFCF, quarterlyValuesFCF);
        }
  
      return result;
  };
  
  
  // --- Hilfsfunktionen für KeyMetrics Formatierung ---
  const formatMetric = (value: string | number | null | undefined): string | null => {
      if (value === undefined || value === null || value === "None" || value === "-") return null;
      const stringValue = String(value);
      const num = parseFloat(stringValue);
      return isNaN(num) ? null : stringValue;
  };
  
  const formatPercentage = (value: string | number | null | undefined): string | null => {
      if (value === undefined || value === null || value === "None" || value === "-") return null;
      const stringValue = String(value).replace('%', '');
      const numValue = parseFloat(stringValue);
      if (isNaN(numValue)) return null;
      // Prüfen, ob der Wert bereits ein Prozentsatz ist (z.B. "0.05") oder als Zahl kommt (z.B. 5)
      // Alpha Vantage gibt oft Dezimalzahlen zurück (z.B. DividendYield = 0.015 für 1.5%)
      if (String(value).includes('%')) {
           return `${numValue.toFixed(2)}%`; // Bereits % -> nur formatieren
      } else if (Math.abs(numValue) <= 1 && Math.abs(numValue) !== 0) { // Wahrscheinlich Dezimalzahl (z.B. 0.05)
           return `${(numValue * 100).toFixed(2)}%`;
      } else { // Wahrscheinlich ganze Zahl oder größer 1 (sollte nicht vorkommen für %)
          return `${numValue.toFixed(2)}%`; // Fallback: Behandle als Zahl und füge % hinzu
      }
  };
  
  
  const formatPriceChange = (value: string | number | null | undefined): string | null => {
      if (value === undefined || value === null || value === "None" || value === "-") return null;
      const num = parseFloat(String(value));
      return isNaN(num) ? null : num.toFixed(2);
  };
  
  const formatMarginForDisplay = (value: number | null): string | null => {
      if (value === null || isNaN(value) || !isFinite(value)) return null;
      return `${value.toFixed(2)}%`;
  };
  
  
  // --- Hauptfunktion zur Verarbeitung aller Rohdaten ---
  export const processStockData = (rawData: RawApiData, ticker: string): {
    companyInfo: CompanyInfo | null;
    keyMetrics: KeyMetrics | null;
    annualData: StockData;
    quarterlyData: StockData;
    annualEPS: StockData;
    quarterlyEPS: StockData;
    annualFCF: StockData;
    quarterlyFCF: StockData;
    annualIncomeStatement: MultiDatasetStockData;
    quarterlyIncomeStatement: MultiDatasetStockData;
    annualMargins: MultiDatasetStockData;
    quarterlyMargins: MultiDatasetStockData;
  } => {
    const { income, earnings, cashflow, overview, quote } = rawData;
  
    // Grundlegende Fehlerprüfung der Rohdaten
    if (!overview?.Symbol) {
       throw new Error(`Keine Unternehmensinformationen (OVERVIEW) für Ticker "${ticker}" verfügbar.`);
    }
     const globalQuote = quote?.['Global Quote'];
     if (!globalQuote?.['05. price']) {
        // Erlaube den Fall, dass der Kurs fehlt, aber andere Daten vorhanden sind.
        // Gib eine Warnung aus statt einen Fehler zu werfen.
         console.warn(`Kein aktueller Aktienkurs (GLOBAL_QUOTE) für Ticker "${ticker}" verfügbar.`);
     }
  
    const hasIncomeData = !!(income?.annualReports || income?.quarterlyReports);
    const hasEarningsData = !!(earnings?.annualEarnings || earnings?.quarterlyEarnings);
    const hasCashflowData = !!(cashflow?.annualReports || cashflow?.quarterlyReports);
  
    if (!hasIncomeData && !hasEarningsData && !hasCashflowData) {
       throw new Error(`Keine Finanzdaten (Income, Earnings, Cashflow) für Ticker "${ticker}" verfügbar.`);
    }
  
    // --- Datenverarbeitung ---
    const incomeProcessed = processIncomeData(income);
    const earningsProcessed = processEarningsData(earnings);
    const cashflowProcessed = processCashflowData(cashflow);
  
    // --- Company Info zusammenstellen ---
    const currentPrice = globalQuote?.['05. price'];
    const companyInfo: CompanyInfo = {
      Name: overview.Name || ticker,
      Industry: overview.Industry || 'N/A',
      Address: overview.Address || 'N/A',
      MarketCapitalization: overview.MarketCapitalization || 'N/A',
      LastSale: currentPrice ? parseFloat(currentPrice).toFixed(2) : 'N/A',
    };
  
    // --- Key Metrics zusammenstellen ---
     const rawChange = globalQuote?.['09. change'];
     const rawChangePercent = globalQuote?.['10. change percent'];
     const numChange = parseFloat(rawChange || '');
  
     const keyMetrics: KeyMetrics = {
         peRatio: formatMetric(overview.PERatio),
         psRatio: formatMetric(overview.PriceToSalesRatioTTM),
         pbRatio: formatMetric(overview.PriceToBookRatio),
         evToEbitda: formatMetric(overview.EVToEBITDA),
         dividendYield: formatPercentage(overview.DividendYield),
         priceChange: formatPriceChange(rawChange),
         priceChangePercent: formatPercentage(rawChangePercent),
         isPositiveChange: !isNaN(numChange) && numChange >= 0,
         // Verwende die berechneten Margen aus dem letzten Jahresbericht
         grossMargin: formatMarginForDisplay(incomeProcessed.latestAnnualGrossMargin),
         operatingMargin: formatMarginForDisplay(incomeProcessed.latestAnnualOperatingMargin),
     };
  
  
    // --- Rückgabe aller verarbeiteten Daten ---
    return {
      companyInfo,
      keyMetrics,
      annualData: incomeProcessed.annualRevenue, // Haupt-Chart zeigt Revenue
      quarterlyData: incomeProcessed.quarterlyRevenue,
      annualEPS: earningsProcessed.annualEPS,
      quarterlyEPS: earningsProcessed.quarterlyEPS,
      annualFCF: cashflowProcessed.annualFCF,
      quarterlyFCF: cashflowProcessed.quarterlyFCF,
      annualIncomeStatement: incomeProcessed.annualIncomeStatement,
      quarterlyIncomeStatement: incomeProcessed.quarterlyIncomeStatement,
      annualMargins: incomeProcessed.annualMargins,
      quarterlyMargins: incomeProcessed.quarterlyMargins,
    };
  };