// src/utils/processing/balanceSheetProcessing.ts
import { StockData, BalanceSheetMetrics } from '../../types/stockDataTypes';
import { formatQuarter, trimData, parseFloatOrZero } from '../utils'; // Importiere benötigte Helfer aus utils.ts

// Definition des Rückgabetyps für diese Verarbeitungsfunktion
export interface ProcessedBalanceSheetData {
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;
  annualDebtToEquity: StockData;
  quarterlyDebtToEquity: StockData;
  // NEUE Metriken, die wir zurückgeben
  latestBalanceSheetMetrics: BalanceSheetMetrics;
}

// Dieser Helfer wird nur hier für Shares gebraucht und kann lokal bleiben
const parseAndScaleShares = (value: string | undefined | null): number => {
    if (value === undefined || value === null || value === "None" || value === "-") return 0;
    const num = parseFloat(value);
    // Teile durch 1 Million für die Anzeige in Millionen
    return isNaN(num) ? 0 : num / 1e6;
};

// Helfer zum Formatieren großer Zahlen in Milliarden/Millionen
const formatLargeNumber = (value: number | null): string | null => {
    if (value === null || isNaN(value)) return null;
    if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    }
    return value.toString();
}

export const processBalanceSheetData = (balanceSheetData: any): ProcessedBalanceSheetData => {
  // Initialisiere mit allen benötigten Feldern
  let result: ProcessedBalanceSheetData = {
    annualSharesOutstanding: { labels: [], values: [] },
    quarterlySharesOutstanding: { labels: [], values: [] },
    annualDebtToEquity: { labels: [], values: [] },
    quarterlyDebtToEquity: { labels: [], values: [] },
    // NEU: Initialisiere das neue Metrik-Objekt
    latestBalanceSheetMetrics: { cash: null, debt: null, netDebt: null }
  };

  if (!balanceSheetData || (!balanceSheetData.annualReports && !balanceSheetData.quarterlyReports)) {
    return result;
  }

  const annualReportsRaw = Array.isArray(balanceSheetData.annualReports) ? balanceSheetData.annualReports : [];
  const annualReports = annualReportsRaw
    .sort((a: any, b: any) => parseInt(a?.fiscalDateEnding?.substring(0, 4)) - parseInt(b?.fiscalDateEnding?.substring(0, 4)));

  if (annualReports.length > 0) {
      const validAnnualReports = annualReports.filter((r:any) =>
          r?.fiscalDateEnding &&
          (r?.commonStockSharesOutstanding || (r?.totalLiabilities && r?.totalShareholderEquity))
      );

      const annualLabels = validAnnualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));

      const annualSharesValues = validAnnualReports.map(r => parseAndScaleShares(r?.commonStockSharesOutstanding));
      result.annualSharesOutstanding = trimData(annualLabels, annualSharesValues);

      const annualDEValues = validAnnualReports.map(r => {
          const totalLiabilities = parseFloatOrZero(r?.totalLiabilities);
          const totalEquity = parseFloatOrZero(r?.totalShareholderEquity);
          if (totalEquity <= 0) return 0;
          const ratio = totalLiabilities / totalEquity;
          return isNaN(ratio) ? 0 : ratio;
      });
      result.annualDebtToEquity = trimData(annualLabels, annualDEValues);

      // --- NEUE LOGIK: Letzte Bilanzkennzahlen extrahieren ---
      const latestReport = annualReports[annualReports.length - 1];
      if (latestReport) {
          const cash = parseFloatOrZero(latestReport.cashAndCashEquivalentsAtCarryingValue);
          const shortTermDebt = parseFloatOrZero(latestReport.shortTermDebt);
          const longTermDebt = parseFloatOrZero(latestReport.longTermDebtNoncurrent ?? latestReport.longTermDebt);
          const totalDebt = shortTermDebt + longTermDebt;
          const netDebt = totalDebt - cash;

          result.latestBalanceSheetMetrics = {
              cash: formatLargeNumber(cash),
              debt: formatLargeNumber(totalDebt),
              netDebt: formatLargeNumber(netDebt)
          }
      }
  }

  // Quartalsdaten-Verarbeitung bleibt für die Charts unverändert
  const quarterlyReportsRaw = Array.isArray(balanceSheetData.quarterlyReports) ? balanceSheetData.quarterlyReports : [];
  const quarterlyReports = quarterlyReportsRaw
    .sort((a: any, b: any) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());

  if (quarterlyReports.length > 0) {
      const validQuarterlyReports = quarterlyReports.filter((r:any) =>
          r?.fiscalDateEnding &&
          (r?.commonStockSharesOutstanding || (r?.totalLiabilities && r?.totalShareholderEquity))
      );
      const quarterlyLabels = validQuarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
      const quarterlySharesValues = validQuarterlyReports.map(r => parseAndScaleShares(r?.commonStockSharesOutstanding));
      result.quarterlySharesOutstanding = trimData(quarterlyLabels, quarterlySharesValues);
      const quarterlyDEValues = validQuarterlyReports.map(r => {
          const totalLiabilities = parseFloatOrZero(r?.totalLiabilities);
          const totalEquity = parseFloatOrZero(r?.totalShareholderEquity);
          if (totalEquity <= 0) return 0;
          const ratio = totalLiabilities / totalEquity;
          return isNaN(ratio) ? 0 : ratio;
      });
      result.quarterlyDebtToEquity = trimData(quarterlyLabels, quarterlyDEValues);
  }

  return result;
};