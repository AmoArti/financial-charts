// src/utils/processing/cashflowProcessing.ts (KORRIGIERT für korrektes Dividendenfeld - Vollständig mit Debug Logs)
import { StockData, MultiDatasetStockData } from '../../types/stockDataTypes';
import { formatQuarter, trimMultiData, parseAndScale, parseFloatOrZero, trimData } from '../utils'; // Importiere benötigte Helfer

// Definition des Rückgabetyps (bleibt gleich)
export interface ProcessedCashflowData {
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;
  annualTotalDividendsPaid: StockData;
  quarterlyTotalDividendsPaid: StockData;
}

export const processCashflowData = (cashFlowData: any): ProcessedCashflowData => {
  // Initialisiere mit allen benötigten Feldern
  let result: ProcessedCashflowData = {
    annualCashflowStatement: { labels: [], datasets: [] },
    quarterlyCashflowStatement: { labels: [], datasets: [] },
    annualTotalDividendsPaid: { labels: [], values: [] },
    quarterlyTotalDividendsPaid: { labels: [], values: [] },
  };

  if (!cashFlowData || (!cashFlowData.annualReports && !cashFlowData.quarterlyReports)) {
    console.warn("Keine Cashflow-Berichte (annual/quarterly) in cashFlowData gefunden.");
    return result;
  }

  console.log("--- Debugging processCashflowData (Fixed Field) ---");

  // --- Jahresdaten ---
  const annualReportsRaw = Array.isArray(cashFlowData.annualReports) ? cashFlowData.annualReports : [];
  const annualReports = annualReportsRaw
    .sort((a: any, b: any) => { // Sicheres Sortieren nach Jahr
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4));
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4));
       if (isNaN(yearA) && isNaN(yearB)) return 0;
       if (isNaN(yearA)) return 1;
       if (isNaN(yearB)) return -1;
       return yearA - yearB;
    });

  if (annualReports.length > 0) {
      // Filtere Reports - prüfe jetzt auf die korrekten Dividendenfelder
      const validAnnualReports = annualReports.filter((r:any) =>
          r?.fiscalDateEnding &&
          // Report ist valide wenn er entweder Cashflow-Daten ODER Dividenden-Daten enthält
          ((r?.operatingCashflow && r?.capitalExpenditures) || r?.dividendPayoutCommonStock || r?.dividendPayout)
      );
      const annualLabels = validAnnualReports.map((r: any) => parseInt(r.fiscalDateEnding.substring(0, 4)));

      if(validAnnualReports.length > 0) {
        console.log("Erster valider Jahresbericht (Cashflow Rohdaten):", JSON.stringify(validAnnualReports[0], null, 2));
      } else {
        console.log("Keine validen Jahresberichte für Cashflow/Dividenden gefunden.");
      }

      // Cashflow Statement
      const annualOCF = validAnnualReports.map(r => parseAndScale(r.operatingCashflow));
      const annualCapEx = validAnnualReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures)));
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

      // Total Dividends Paid (Jährlich) - KORRIGIERT
      const annualDividendsValues = validAnnualReports.map(r => {
          // Nutze 'dividendPayoutCommonStock', falle auf 'dividendPayout' zurück
          const paidRaw = r?.dividendPayoutCommonStock ?? r?.dividendPayout;
          const paid = parseFloatOrZero(paidRaw);
          // console.log(`Jahr ${r?.fiscalDateEnding?.substring(0,4)} - Raw Dividend Payout: ${paidRaw}, Parsed: ${paid}`); // Optionales Detail-Log
          return Math.abs(paid) / 1e9; // Skaliere auf Mrd. (konsistent mit Cashflow)
      });
      console.log("Berechnete Jahres-Dividendenwerte (skaliert, vor trimData):", annualDividendsValues);
      result.annualTotalDividendsPaid = trimData(annualLabels, annualDividendsValues); // Trimmen
      console.log("Final annualTotalDividendsPaid (nach trimData):", JSON.stringify(result.annualTotalDividendsPaid));
  } else {
     console.log("Keine Jahresberichte für Cashflow gefunden.");
  }

  // --- Quartalsdaten ---
  const quarterlyReportsRaw = Array.isArray(cashFlowData.quarterlyReports) ? cashFlowData.quarterlyReports : [];
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
      // Filtere Reports - prüfe jetzt auf die korrekten Dividendenfelder
      const validQuarterlyReports = quarterlyReports.filter((r:any) =>
           r?.fiscalDateEnding &&
          (r?.operatingCashflow && r?.capitalExpenditures || r?.dividendPayoutCommonStock || r?.dividendPayout)
      );
      const quarterlyLabels = validQuarterlyReports.map((r: any) => formatQuarter(r.fiscalDateEnding));

      if(validQuarterlyReports.length > 0) {
        console.log("Erster valider Quartalsbericht (Cashflow Rohdaten):", JSON.stringify(validQuarterlyReports[0], null, 2));
      } else {
         console.log("Keine validen Quartalsberichte für Cashflow/Dividenden gefunden.");
      }

      // Cashflow Statement
      const quarterlyOCF = validQuarterlyReports.map(r => parseAndScale(r.operatingCashflow));
      const quarterlyCapEx = validQuarterlyReports.map(r => Math.abs(parseAndScale(r.capitalExpenditures)));
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

       // Total Dividends Paid (Quartalsweise) - KORRIGIERT
      const quarterlyDividendsValues = validQuarterlyReports.map(r => {
          // Nutze 'dividendPayoutCommonStock', falle auf 'dividendPayout' zurück
          const paidRaw = r?.dividendPayoutCommonStock ?? r?.dividendPayout;
          const paid = parseFloatOrZero(paidRaw);
           // console.log(`Quartal ${formatQuarter(r?.fiscalDateEnding)} - Raw Dividend Payout: ${paidRaw}, Parsed: ${paid}`); // Optionales Detail-Log
          return Math.abs(paid) / 1e9; // Skaliere auf Mrd.
      });
      console.log("Berechnete Quartals-Dividendenwerte (skaliert, vor trimData):", quarterlyDividendsValues);
      result.quarterlyTotalDividendsPaid = trimData(quarterlyLabels, quarterlyDividendsValues); // Trimmen
      console.log("Final quarterlyTotalDividendsPaid (nach trimData):", JSON.stringify(result.quarterlyTotalDividendsPaid));
  } else {
      console.log("Keine Quartalsberichte für Cashflow gefunden.");
  }
  console.log("--- Ende Debugging processCashflowData ---");
  return result;
};
// --- Ende cashflowProcessing.ts ---