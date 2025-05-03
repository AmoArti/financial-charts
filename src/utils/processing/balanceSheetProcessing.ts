// src/utils/processing/balanceSheetProcessing.ts
import { StockData } from '../../types/stockDataTypes';
import { formatQuarter, trimData, parseFloatOrZero } from '../utils'; // Importiere benötigte Helfer aus utils.ts

// Definition des Rückgabetyps für diese Verarbeitungsfunktion
export interface ProcessedBalanceSheetData {
  annualSharesOutstanding: StockData;
  quarterlySharesOutstanding: StockData;
  annualDebtToEquity: StockData;
  quarterlyDebtToEquity: StockData;
}

// Dieser Helfer wird nur hier für Shares gebraucht und kann lokal bleiben
const parseAndScaleShares = (value: string | undefined | null): number => {
    if (value === undefined || value === null || value === "None" || value === "-") return 0;
    const num = parseFloat(value);
    // Teile durch 1 Million für die Anzeige in Millionen
    return isNaN(num) ? 0 : num / 1e6;
};

export const processBalanceSheetData = (balanceSheetData: any): ProcessedBalanceSheetData => {
  // Initialisiere mit allen benötigten Feldern
  let result: ProcessedBalanceSheetData = {
    annualSharesOutstanding: { labels: [], values: [] },
    quarterlySharesOutstanding: { labels: [], values: [] },
    annualDebtToEquity: { labels: [], values: [] },
    quarterlyDebtToEquity: { labels: [], values: [] },
  };

  // Überprüfe, ob überhaupt Berichtsdaten vorhanden sind
  if (!balanceSheetData || (!balanceSheetData.annualReports && !balanceSheetData.quarterlyReports)) {
    console.warn("Keine Bilanzberichte (annual/quarterly) in balanceSheetData gefunden.");
    return result;
  }

  // --- Jahresdaten ---
  const annualReportsRaw = Array.isArray(balanceSheetData.annualReports) ? balanceSheetData.annualReports : [];
  const annualReports = annualReportsRaw
    .sort((a: any, b: any) => { // Sicheres Sortieren nach Jahr
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1; // Ungültige Daten nach hinten
       if (isNaN(yearB)) return -1; // Ungültige Daten nach hinten
       return yearA - yearB;
    });

  if (annualReports.length > 0) {
      // Filtere Reports ohne gültiges Datum oder benötigte Werte für Shares ODER D/E
      const validAnnualReports = annualReports.filter((r:any) =>
          r?.fiscalDateEnding &&
          (r?.commonStockSharesOutstanding || (r?.totalLiabilities && r?.totalShareholderEquity)) // Mindestens eins muss da sein
      );

      // Extrahiere Labels nur von validen Reports
      const annualLabels = validAnnualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));

      // --- Shares Outstanding (Jährlich) ---
      // Extrahiere Werte, nutze 0 als Fallback wenn Feld fehlt
      const annualSharesValues = validAnnualReports.map(r => parseAndScaleShares(r?.commonStockSharesOutstanding));
      result.annualSharesOutstanding = trimData(annualLabels, annualSharesValues);

      // --- Debt-to-Equity Ratio (Jährlich) ---
      // Extrahiere Werte, nutze Helfer für Berechnung, 0 als Fallback
      const annualDEValues = validAnnualReports.map(r => {
          const totalLiabilities = parseFloatOrZero(r?.totalLiabilities); // parseFloatOrZero aus utils
          const totalEquity = parseFloatOrZero(r?.totalShareholderEquity);
          // Verhindere Division durch Null oder negatives Eigenkapital
          if (totalEquity <= 0) {
              // console.warn(`Eigenkapital <= 0 für ${r?.fiscalDateEnding}, D/E wird 0 gesetzt.`);
              return 0; // Oder null, wenn der Chart das besser darstellen kann
          }
          const ratio = totalLiabilities / totalEquity;
          return isNaN(ratio) ? 0 : ratio; // Gib das reine Verhältnis zurück, 0 bei NaN
      });
      result.annualDebtToEquity = trimData(annualLabels, annualDEValues);
  }

  // --- Quartalsdaten ---
  const quarterlyReportsRaw = Array.isArray(balanceSheetData.quarterlyReports) ? balanceSheetData.quarterlyReports : [];
  const quarterlyReports = quarterlyReportsRaw
    .sort((a: any, b: any) => { // Sicheres Sortieren nach Datum
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });

  if (quarterlyReports.length > 0) {
       // Filtere Reports ohne gültiges Datum oder benötigte Werte für Shares ODER D/E
      const validQuarterlyReports = quarterlyReports.filter((r:any) =>
          r?.fiscalDateEnding &&
          (r?.commonStockSharesOutstanding || (r?.totalLiabilities && r?.totalShareholderEquity))
      );

      // Extrahiere Labels nur von validen Reports
      const quarterlyLabels = validQuarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding)); // formatQuarter aus utils

      // --- Shares Outstanding (Quartalsweise) ---
      // Extrahiere Werte, nutze 0 als Fallback
      const quarterlySharesValues = validQuarterlyReports.map(r => parseAndScaleShares(r?.commonStockSharesOutstanding));
      result.quarterlySharesOutstanding = trimData(quarterlyLabels, quarterlySharesValues);

       // --- Debt-to-Equity Ratio (Quartalsweise) ---
       // Extrahiere Werte, nutze Helfer für Berechnung, 0 als Fallback
      const quarterlyDEValues = validQuarterlyReports.map(r => {
          const totalLiabilities = parseFloatOrZero(r?.totalLiabilities); // parseFloatOrZero aus utils
          const totalEquity = parseFloatOrZero(r?.totalShareholderEquity);
          if (totalEquity <= 0) {
              return 0; // Oder null
          }
          const ratio = totalLiabilities / totalEquity;
          return isNaN(ratio) ? 0 : ratio; // Gib das reine Verhältnis zurück, 0 bei NaN
      });
      result.quarterlyDebtToEquity = trimData(quarterlyLabels, quarterlyDEValues);
  }

  return result;
};

// --- Ende balanceSheetProcessing.ts ---