// src/utils/processing/earningsProcessing.ts
import { MultiDatasetStockData } from '../../types/stockDataTypes';
import { formatQuarter, trimMultiData, parseFloatOrZero } from '../utils';

export interface ProcessedEarningsData {
  annualEPS: MultiDatasetStockData;
  quarterlyEPS: MultiDatasetStockData;
}

export const processEarningsData = (earningsData: any): ProcessedEarningsData => {
  const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };
  let result: ProcessedEarningsData = {
    annualEPS: { ...initialMultiData },
    quarterlyEPS: { ...initialMultiData },
  };

  if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
    console.warn("Keine Earnings-Berichte (annual/quarterly) in earningsData gefunden.");
    return result;
  }

  // --- Jahresdaten (absteigend sortieren, damit der Neueste zuerst kommt) ---
  const annualEarningsRaw = Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [];
  const annualEarnings = annualEarningsRaw
    .sort((a: any, b: any) => {
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearB - yearA; // KORREKTUR: Absteigend sortieren (B - A)
    });

  if (annualEarnings.length > 0) {
    const validAnnualEarnings = annualEarnings.filter((e: any) =>
        e?.fiscalDateEnding && (e?.reportedEPS || e?.estimatedEPS)
    );
    // Für die Chart-Darstellung (links=alt, rechts=neu) müssen wir die Daten wieder umkehren
    const annualLabels = validAnnualEarnings.map((e: any) => parseInt(e.fiscalDateEnding.substring(0, 4))).reverse();

    const annualValuesReportedEPS = validAnnualEarnings.map((e: any) => parseFloatOrZero(e?.reportedEPS)).reverse();
    const annualValuesEstimatedEPS = validAnnualEarnings.map((e: any) => parseFloatOrZero(e?.estimatedEPS)).reverse();

    result.annualEPS = trimMultiData({
      labels: annualLabels,
      datasets: [
        { label: 'Reported EPS', values: annualValuesReportedEPS },
        { label: 'Estimated EPS', values: annualValuesEstimatedEPS },
      ],
    });
  }

  // --- Quartalsdaten (absteigend sortieren, damit der Neueste zuerst kommt) ---
  const quarterlyEarningsRaw = Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [];
  const quarterlyEarnings = quarterlyEarningsRaw
    .sort((a: any, b: any) => {
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA; // KORREKTUR: Absteigend sortieren (B - A)
    });

  if (quarterlyEarnings.length > 0) {
    const validQuarterlyEarnings = quarterlyEarnings.filter((e: any) =>
        e?.fiscalDateEnding && (e?.reportedEPS || e?.estimatedEPS)
    );
    // Für die Chart-Darstellung (links=alt, rechts=neu) müssen wir die Daten wieder umkehren
    const quarterlyLabels = validQuarterlyEarnings.map((e: any) => formatQuarter(e.fiscalDateEnding)).reverse();

    const quarterlyValuesReportedEPS = validQuarterlyEarnings.map((e: any) => parseFloatOrZero(e?.reportedEPS)).reverse();
    const quarterlyValuesEstimatedEPS = validQuarterlyEarnings.map((e: any) => parseFloatOrZero(e?.estimatedEPS)).reverse();

    result.quarterlyEPS = trimMultiData({
      labels: quarterlyLabels,
      datasets: [
        { label: 'Reported EPS', values: quarterlyValuesReportedEPS },
        { label: 'Estimated EPS', values: quarterlyValuesEstimatedEPS },
      ],
    });
  }

  return result;
};