// src/utils/processing/earningsProcessing.ts
import { MultiDatasetStockData, RawEarningReport } from '../../types/stockDataTypes';
import { formatQuarter, parseFloatOrZero } from '../utils';

export interface ProcessedEarningsData {
  annualEPS: MultiDatasetStockData;
  quarterlyEPS: MultiDatasetStockData;
}

export const processEarningsData = (earningsData: any): ProcessedEarningsData => {
  const initialMultiData: MultiDatasetStockData = { labels: [], datasets: [] };
  const result: ProcessedEarningsData = {
    annualEPS: { ...initialMultiData },
    quarterlyEPS: { ...initialMultiData },
  };

  if (!earningsData || (!earningsData.annualEarnings && !earningsData.quarterlyEarnings)) {
    return result;
  }

  const annualEarningsRaw = Array.isArray(earningsData.annualEarnings) ? earningsData.annualEarnings : [];
  const annualEarnings = annualEarningsRaw
    .sort((a: RawEarningReport, b: RawEarningReport) => {
       const yearA = parseInt(a?.fiscalDateEnding?.substring(0, 4) || '0');
       const yearB = parseInt(b?.fiscalDateEnding?.substring(0, 4) || '0');
       return yearB - yearA;
    });

  if (annualEarnings.length > 0) {
    const validAnnualEarnings = annualEarnings.filter((e: RawEarningReport) => e?.fiscalDateEnding && (e?.reportedEPS || e?.estimatedEPS));
    const annualLabels = validAnnualEarnings.map((e: RawEarningReport) => parseInt(e.fiscalDateEnding!.substring(0, 4))).reverse();
    const annualValuesReportedEPS = validAnnualEarnings.map((e: RawEarningReport) => parseFloatOrZero(e?.reportedEPS)).reverse();
    const annualValuesEstimatedEPS = validAnnualEarnings.map((e: RawEarningReport) => parseFloatOrZero(e?.estimatedEPS)).reverse();

    const annualDatasets = [{ label: 'Reported EPS', values: annualValuesReportedEPS }];
    if (annualValuesEstimatedEPS.some((value: number) => value !== 0)) {
        annualDatasets.push({ label: 'Estimated EPS', values: annualValuesEstimatedEPS });
    }
    result.annualEPS = { labels: annualLabels, datasets: annualDatasets };
  }

  const quarterlyEarningsRaw = Array.isArray(earningsData.quarterlyEarnings) ? earningsData.quarterlyEarnings : [];
  const quarterlyEarnings = quarterlyEarningsRaw
    .sort((a: RawEarningReport, b: RawEarningReport) => {
        const dateA = a?.fiscalDateEnding ? new Date(a.fiscalDateEnding).getTime() : 0;
        const dateB = b?.fiscalDateEnding ? new Date(b.fiscalDateEnding).getTime() : 0;
        return dateB - dateA;
    });

  if (quarterlyEarnings.length > 0) {
    const validQuarterlyEarnings = quarterlyEarnings.filter((e: RawEarningReport) => e?.fiscalDateEnding && (e?.reportedEPS || e?.estimatedEPS));
    const quarterlyLabels = validQuarterlyEarnings.map((e: RawEarningReport) => formatQuarter(e.fiscalDateEnding)).reverse();
    const quarterlyValuesReportedEPS = validQuarterlyEarnings.map((e: RawEarningReport) => parseFloatOrZero(e?.reportedEPS)).reverse();
    const quarterlyValuesEstimatedEPS = validQuarterlyEarnings.map((e: RawEarningReport) => parseFloatOrZero(e?.estimatedEPS)).reverse();

    const quarterlyDatasets = [{ label: 'Reported EPS', values: quarterlyValuesReportedEPS }];
    if (quarterlyValuesEstimatedEPS.some((value: number) => value !== 0)) {
      quarterlyDatasets.push({ label: 'Estimated EPS', values: quarterlyValuesEstimatedEPS });
    }
    result.quarterlyEPS = { labels: quarterlyLabels, datasets: quarterlyDatasets };
  }

  return result;
};