// src/utils/processing/earningsProcessing.ts
import { StockData } from '../../types/stockDataTypes';
import { formatQuarter, trimData } from '../utils'; // Importiere Helfer aus utils.ts

// Definition des Rückgabetyps für Klarheit
export interface ProcessedEarningsData {
  annualEPS: StockData;
  quarterlyEPS: StockData;
}

export const processEarningsData = (earningsData: any): ProcessedEarningsData => {
  let result: ProcessedEarningsData = {
    annualEPS: { labels: [], values: [] },
    quarterlyEPS: { labels: [], values: [] },
  };

  // Überprüfe, ob überhaupt Daten vorhanden sind
  if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
    return result;
  }

  // Jahresdaten
  // Stelle sicher, dass annualEarnings ein Array ist, bevor sort aufgerufen wird
  const annualEarnings = (Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [])
    .sort((a: any, b: any) => {
       // Füge Parsing hinzu, um sicherzustellen, dass es Zahlen sind
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       // Behandle NaN-Fälle
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1; // Setze NaN ans Ende
       if (isNaN(yearB)) return -1; // Setze NaN ans Ende
       return yearA - yearB;
    });

  if (annualEarnings.length > 0) {
    // Filtere Einträge ohne gültiges Datum oder EPS vor dem Mappen
    const validAnnualEarnings = annualEarnings.filter((e: any) => e?.fiscalDateEnding && e?.reportedEPS);
    const annualLabelsEPS = validAnnualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));
    const annualValuesEPS = validAnnualEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
    // Wende trimData auf die gefilterten und gemappten Daten an
    result.annualEPS = trimData(annualLabelsEPS, annualValuesEPS);
  }

  // Quartalsdaten
  // Stelle sicher, dass quarterlyEarnings ein Array ist, bevor sort aufgerufen wird
  const quarterlyEarnings = (Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [])
    .sort((a: any, b: any) => {
        // Sicherer Vergleich von Daten
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });

  if (quarterlyEarnings.length > 0) {
     // Filtere Einträge ohne gültiges Datum oder EPS vor dem Mappen
    const validQuarterlyEarnings = quarterlyEarnings.filter((e: any) => e?.fiscalDateEnding && e?.reportedEPS);
    const quarterlyLabelsEPS = validQuarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));
    const quarterlyValuesEPS = validQuarterlyEarnings.map((e: any) => parseFloat(e.reportedEPS) || 0);
    // Wende trimData auf die gefilterten und gemappten Daten an
    result.quarterlyEPS = trimData(quarterlyLabelsEPS, quarterlyValuesEPS);
  }

  return result;
};