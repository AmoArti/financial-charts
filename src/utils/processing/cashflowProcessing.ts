// src/utils/processing/cashflowProcessing.ts
import { MultiDatasetStockData } from '../../types/stockDataTypes';
import { formatQuarter, trimMultiData, parseAndScale, parseFloatOrZero } from '../utils'; // Importiere Helfer aus utils.ts

// Definition des Rückgabetyps für Klarheit
export interface ProcessedCashflowData {
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;
}

export const processCashflowData = (cashFlowData: any): ProcessedCashflowData => {
  let result: ProcessedCashflowData = {
    annualCashflowStatement: { labels: [], datasets: [] },
    quarterlyCashflowStatement: { labels: [], datasets: [] },
  };

  // Überprüfe, ob überhaupt Daten vorhanden sind
  if (!cashFlowData || (!cashFlowData.annualReports && !cashFlowData.quarterlyReports)) {
    return result;
  }

  // Jahresdaten
  // Stelle sicher, dass annualReports ein Array ist
  const annualCashFlowReports = (Array.isArray(cashFlowData.annualReports) ? cashFlowData.annualReports : [])
    .sort((a: any, b: any) => {
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearA - yearB;
    });

  if (annualCashFlowReports.length > 0) {
    // Filtere Reports mit ungültigem Datum oder fehlenden Werten vor dem Mappen
     const validAnnualReports = annualCashFlowReports.filter((r: any) =>
        r?.fiscalDateEnding && r?.operatingCashflow && r?.capitalExpenditures
     );
    const annualLabels = validAnnualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));
    const annualOCF = validAnnualReports.map(r => parseAndScale(r.operatingCashflow));
    const annualCapEx = validAnnualReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures))); // Positiv!
    const annualFCFValues = validAnnualReports.map(r => {
      const ocf = parseFloatOrZero(r.operatingCashflow);
      const capex = parseFloatOrZero(r.capitalExpenditures);
      return (ocf - Math.abs(capex)) / 1e9; // Skaliert auf Mrd.
    });

    result.annualCashflowStatement = trimMultiData({
      labels: annualLabels,
      datasets: [
        { label: 'Operating Cash Flow', values: annualOCF },
        { label: 'Capital Expenditure', values: annualCapEx },
        { label: 'Free Cash Flow', values: annualFCFValues }
      ]
    });
  }

  // Quartalsdaten
  // Stelle sicher, dass quarterlyReports ein Array ist
  const quarterlyCashFlowReports = (Array.isArray(cashFlowData.quarterlyReports) ? cashFlowData.quarterlyReports : [])
    .sort((a: any, b: any) => {
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
    });

  if (quarterlyCashFlowReports.length > 0) {
    // Filtere Reports mit ungültigem Datum oder fehlenden Werten vor dem Mappen
    const validQuarterlyReports = quarterlyCashFlowReports.filter((r: any) =>
        r?.fiscalDateEnding && r?.operatingCashflow && r?.capitalExpenditures
    );
    const quarterlyLabels = validQuarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));
    const quarterlyOCF = validQuarterlyReports.map(r => parseAndScale(r.operatingCashflow));
    const quarterlyCapEx = validQuarterlyReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures))); // Positiv!
    const quarterlyFCFValues = validQuarterlyReports.map(r => {
      const ocf = parseFloatOrZero(r.operatingCashflow);
      const capex = parseFloatOrZero(r.capitalExpenditures);
      return (ocf - Math.abs(capex)) / 1e9; // Skaliert auf Mrd.
    });

    result.quarterlyCashflowStatement = trimMultiData({
      labels: quarterlyLabels,
      datasets: [
        { label: 'Operating Cash Flow', values: quarterlyOCF },
        { label: 'Capital Expenditure', values: quarterlyCapEx },
        { label: 'Free Cash Flow', values: quarterlyFCFValues }
      ]
    });
  }

  return result;
};