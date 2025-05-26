// src/utils/processing/earningsProcessing.ts
import { MultiDatasetStockData } from '../../types/stockDataTypes'; // Geändert von StockData
import { formatQuarter, trimMultiData, parseFloatOrZero } from '../utils'; // trimData wird zu trimMultiData

// Definition des Rückgabetyps (JETZT MultiDatasetStockData für EPS)
export interface ProcessedEarningsData {
  annualEPS: MultiDatasetStockData;
  quarterlyEPS: MultiDatasetStockData;
}

export const processEarningsData = (earningsData: any): ProcessedEarningsData => {
  const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };
  let result: ProcessedEarningsData = {
    annualEPS: { ...initialMultiData }, // Kopiere initialMultiData
    quarterlyEPS: { ...initialMultiData },// Kopiere initialMultiData
  };

  if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
    console.warn("Keine Earnings-Berichte (annual/quarterly) in earningsData gefunden.");
    return result;
  }

  // --- Jahresdaten ---
  const annualEarningsRaw = Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [];
  const annualEarnings = annualEarningsRaw
    .sort((a: any, b: any) => {
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearA - yearB;
    });

  if (annualEarnings.length > 0) {
    const validAnnualEarnings = annualEarnings.filter((e: any) =>
        e?.fiscalDateEnding && (e?.reportedEPS || e?.estimatedEPS) // Valide, wenn mindestens eines vorhanden
    );
    const annualLabels = validAnnualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4)));

    const annualValuesReportedEPS = validAnnualEarnings.map((e: any) => parseFloatOrZero(e?.reportedEPS));
    const annualValuesEstimatedEPS = validAnnualEarnings.map((e: any) => parseFloatOrZero(e?.estimatedEPS));

    result.annualEPS = trimMultiData({ // trimMultiData anwenden
      labels: annualLabels,
      datasets: [
        { label: 'Reported EPS', values: annualValuesReportedEPS },
        { label: 'Estimated EPS', values: annualValuesEstimatedEPS },
      ],
    });
  }

  // --- Quartalsdaten ---
  const quarterlyEarningsRaw = Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [];
  const quarterlyEarnings = quarterlyEarningsRaw
    .sort((a: any, b: any) => {
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });

  if (quarterlyEarnings.length > 0) {
    const validQuarterlyEarnings = quarterlyEarnings.filter((e: any) =>
        e?.fiscalDateEnding && (e?.reportedEPS || e?.estimatedEPS) // Valide, wenn mindestens eines vorhanden
    );
    const quarterlyLabels = validQuarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding));

    const quarterlyValuesReportedEPS = validQuarterlyEarnings.map((e: any) => parseFloatOrZero(e?.reportedEPS));
    const quarterlyValuesEstimatedEPS = validQuarterlyEarnings.map((e: any) => parseFloatOrZero(e?.estimatedEPS));

    result.quarterlyEPS = trimMultiData({ // trimMultiData anwenden
      labels: quarterlyLabels,
      datasets: [
        { label: 'Reported EPS', values: quarterlyValuesReportedEPS },
        { label: 'Estimated EPS', values: quarterlyValuesEstimatedEPS },
      ],
    });
  }

  return result;
};
// --- Ende earningsProcessing.ts ---