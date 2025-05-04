// src/utils/processing/earningsProcessing.ts (Bereinigt - Nur noch EPS)
import { StockData } from '../../types/stockDataTypes';
// Importiere benötigte Helfer aus utils.ts
import { formatQuarter, trimData, parseFloatOrZero } from '../utils';

// Definition des Rückgabetyps (Nur noch EPS)
export interface ProcessedEarningsData {
  annualEPS: StockData;
  quarterlyEPS: StockData;
  // DPS Felder entfernt
}

export const processEarningsData = (earningsData: any): ProcessedEarningsData => {
  // Initialisiere nur noch EPS Felder
  let result: ProcessedEarningsData = {
    annualEPS: { labels: [], values: [] },
    quarterlyEPS: { labels: [], values: [] },
  };

  // Überprüfe, ob überhaupt Daten vorhanden sind
  if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
    console.warn("Keine Earnings-Berichte (annual/quarterly) in earningsData gefunden.");
    return result;
  }

  // --- Jahresdaten ---
  const annualEarningsRaw = Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [];
  const annualEarnings = annualEarningsRaw
    .sort((a: any, b: any) => { // Sicheres Sortieren nach Jahr
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearA - yearB;
    });

  if (annualEarnings.length > 0) {
    // Filtere Einträge ohne gültiges Datum ODER ohne EPS
    const validAnnualEarnings = annualEarnings.filter((e: any) =>
        e?.fiscalDateEnding && e?.reportedEPS // Nur EPS relevant
    );
    const annualLabels = validAnnualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));

    // EPS (Jährlich)
    const annualValuesEPS = validAnnualEarnings.map((e: any) => parseFloatOrZero(e?.reportedEPS));
    result.annualEPS = trimData(annualLabels, annualValuesEPS);

    // KEINE DPS-Berechnung mehr hier
  }

  // --- Quartalsdaten ---
  const quarterlyEarningsRaw = Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [];
  const quarterlyEarnings = quarterlyEarningsRaw
    .sort((a: any, b: any) => { // Sicheres Sortieren nach Datum
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });

  if (quarterlyEarnings.length > 0) {
    // Filtere Einträge ohne gültiges Datum ODER ohne EPS
    const validQuarterlyEarnings = quarterlyEarnings.filter((e: any) =>
        e?.fiscalDateEnding && e?.reportedEPS
    );
    const quarterlyLabels = validQuarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));

    // EPS (Quartalsweise)
    const quarterlyValuesEPS = validQuarterlyEarnings.map((e: any) => parseFloatOrZero(e?.reportedEPS));
    result.quarterlyEPS = trimData(quarterlyLabels, quarterlyValuesEPS);

    // KEINE DPS-Berechnung mehr hier
  }

  return result;
};
// --- Ende earningsProcessing.ts ---