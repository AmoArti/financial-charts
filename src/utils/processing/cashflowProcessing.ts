// src/utils/processing/cashflowProcessing.ts
import { StockData, MultiDatasetStockData, RawReport } from '../../types/stockDataTypes';
import { formatQuarter, trimMultiData, parseAndScale, parseFloatOrZero, trimData } from '../utils';

export interface ProcessedCashflowData {
  annualCashflowStatement: MultiDatasetStockData;
  quarterlyCashflowStatement: MultiDatasetStockData;
  annualTotalDividendsPaid: StockData;
  quarterlyTotalDividendsPaid: StockData;
}

export const processCashflowData = (cashFlowData: any): ProcessedCashflowData => {
  let result: ProcessedCashflowData = {
    annualCashflowStatement: { labels: [], datasets: [] },
    quarterlyCashflowStatement: { labels: [], datasets: [] },
    annualTotalDividendsPaid: { labels: [], values: [] },
    quarterlyTotalDividendsPaid: { labels: [], values: [] },
  };

  if (!cashFlowData || (!cashFlowData.annualReports && !cashFlowData.quarterlyReports)) {
    return result;
  }

  const annualReportsRaw = Array.isArray(cashFlowData.annualReports) ? cashFlowData.annualReports : [];
  const annualReports = annualReportsRaw
    .sort((a: RawReport, b: RawReport) => parseInt(a?.fiscalDateEnding?.substring(0, 4) || '0') - parseInt(b?.fiscalDateEnding?.substring(0, 4) || '0'));

  if (annualReports.length > 0) {
      const validAnnualReports = annualReports.filter((r: RawReport) => r?.fiscalDateEnding && ((r?.operatingCashflow && r?.capitalExpenditures) || r?.dividendPayoutCommonStock || r?.dividendPayout));
      const annualLabels = validAnnualReports.map((r: RawReport) => parseInt(r.fiscalDateEnding!.substring(0, 4)));

      const annualOCF = validAnnualReports.map((r: RawReport) => parseAndScale(r.operatingCashflow));
      const annualCapEx = validAnnualReports.map((r: RawReport) => -Math.abs(parseAndScale(r.capitalExpenditures)));
      const annualFCFValues = validAnnualReports.map((r: RawReport) => (parseFloatOrZero(r.operatingCashflow) + parseFloatOrZero(r.capitalExpenditures)) / 1e9);
      result.annualCashflowStatement = trimMultiData({
        labels: annualLabels,
        datasets: [ { label: 'Operating Cash Flow', values: annualOCF }, { label: 'Capital Expenditure', values: annualCapEx }, { label: 'Free Cash Flow', values: annualFCFValues } ]
      });

      const annualDividendsValues = validAnnualReports.map((r: RawReport) => Math.abs(parseFloatOrZero(r?.dividendPayoutCommonStock ?? r?.dividendPayout)) / 1e9);
      result.annualTotalDividendsPaid = trimData(annualLabels, annualDividendsValues);
  }

  const quarterlyReportsRaw = Array.isArray(cashFlowData.quarterlyReports) ? cashFlowData.quarterlyReports : [];
  const quarterlyReports = quarterlyReportsRaw
    .sort((a: RawReport, b: RawReport) => new Date(a.fiscalDateEnding || 0).getTime() - new Date(b.fiscalDateEnding || 0).getTime());

  if (quarterlyReports.length > 0) {
      const validQuarterlyReports = quarterlyReports.filter((r: RawReport) => r?.fiscalDateEnding && (r?.operatingCashflow && r?.capitalExpenditures || r?.dividendPayoutCommonStock || r?.dividendPayout));
      const quarterlyLabels = validQuarterlyReports.map((r: RawReport) => formatQuarter(r.fiscalDateEnding));

      const quarterlyOCF = validQuarterlyReports.map((r: RawReport) => parseAndScale(r.operatingCashflow));
      const quarterlyCapEx = validQuarterlyReports.map((r: RawReport) => -Math.abs(parseAndScale(r.capitalExpenditures)));
      const quarterlyFCFValues = validQuarterlyReports.map((r: RawReport) => (parseFloatOrZero(r.operatingCashflow) + parseFloatOrZero(r.capitalExpenditures)) / 1e9);
      result.quarterlyCashflowStatement = trimMultiData({
        labels: quarterlyLabels,
        datasets: [ { label: 'Operating Cash Flow', values: quarterlyOCF }, { label: 'Capital Expenditure', values: quarterlyCapEx }, { label: 'Free Cash Flow', values: quarterlyFCFValues } ]
      });

      const quarterlyDividendsValues = validQuarterlyReports.map((r: RawReport) => Math.abs(parseFloatOrZero(r?.dividendPayoutCommonStock ?? r?.dividendPayout)) / 1e9);
      result.quarterlyTotalDividendsPaid = trimData(quarterlyLabels, quarterlyDividendsValues);
  }
  return result;
};