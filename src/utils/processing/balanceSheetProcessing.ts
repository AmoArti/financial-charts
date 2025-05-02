// src/utils/processing/balanceSheetProcessing.ts
import { StockData } from '../../types/stockDataTypes';
import { formatQuarter, trimData } from '../utils'; // Importiere Helfer aus utils.ts

// Definition des Rückgabetyps für Klarheit
export interface ProcessedBalanceSheetData {
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;
}

// Dieser Helfer wird nur hier gebraucht und kann lokal bleiben
const parseAndScaleShares = (value: string | undefined | null): number => {
    if (value === undefined || value === null || value === "None" || value === "-") return 0;
    const num = parseFloat(value);
    // Teile durch 1 Million für die Anzeige in Millionen
    return isNaN(num) ? 0 : num / 1e6;
};

export const processBalanceSheetData = (balanceSheetData: any): ProcessedBalanceSheetData => {
  let result: ProcessedBalanceSheetData = {
    annualSharesOutstanding: { labels: [], values: [] },
    quarterlySharesOutstanding: { labels: [], values: [] },
  };

  // Überprüfe, ob überhaupt Daten vorhanden sind
  if (!balanceSheetData || (!balanceSheetData.annualReports && !balanceSheetData.quarterlyReports)) {
    return result;
  }

  // Jahresdaten
  // Stelle sicher, dass annualReports ein Array ist
  const annualReports = (Array.isArray(balanceSheetData.annualReports) ? balanceSheetData.annualReports : [])
    .sort((a: any, b: any) => {
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearA - yearB;
    });

  if (annualReports.length > 0) {
      // Filtere Reports ohne gültiges Datum oder Wert
      const validAnnualReports = annualReports.filter((r:any) => r?.fiscalDateEnding && r?.commonStockSharesOutstanding);
      const annualLabels = validAnnualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
      // Nutze lokalen Helfer
      const annualValues = validAnnualReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
      // Nutze trimData aus utils
      result.annualSharesOutstanding = trimData(annualLabels, annualValues);
  }

  // Quartalsdaten
  // Stelle sicher, dass quarterlyReports ein Array ist
  const quarterlyReports = (Array.isArray(balanceSheetData.quarterlyReports) ? balanceSheetData.quarterlyReports : [])
    .sort((a: any, b: any) => {
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });

  if (quarterlyReports.length > 0) {
       // Filtere Reports ohne gültiges Datum oder Wert
      const validQuarterlyReports = quarterlyReports.filter((r:any) => r?.fiscalDateEnding && r?.commonStockSharesOutstanding);
      // Nutze formatQuarter aus utils
      const quarterlyLabels = validQuarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
      // Nutze lokalen Helfer
      const quarterlyValues = validQuarterlyReports.map(r => parseAndScaleShares(r.commonStockSharesOutstanding));
      // Nutze trimData aus utils
      result.quarterlySharesOutstanding = trimData(quarterlyLabels, quarterlyValues);
  }

  return result;
};