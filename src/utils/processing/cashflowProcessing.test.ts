// src/utils/processing/cashflowProcessing.test.ts

import { processCashflowData } from './cashflowProcessing';
import type { RawCashflowData, StockData, MultiDatasetStockData, RawReport } from '../../types/stockDataTypes';

describe('processCashflowData', () => {
  const emptyStockData: StockData = { labels: [], values: [] };
  const emptyMultiDatasetStockData: MultiDatasetStockData = { labels: [], datasets: [] };

  const initialExpectedResult = {
    annualCashflowStatement: emptyMultiDatasetStockData,
    quarterlyCashflowStatement: emptyMultiDatasetStockData,
    annualTotalDividendsPaid: emptyStockData,
    quarterlyTotalDividendsPaid: emptyStockData,
  };

  // Testfall 1: Leere Eingabedaten
  it('should return initial empty data if raw data is undefined', () => {
    const rawData = undefined;
    const result = processCashflowData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if raw data is null', () => {
    const rawData = null;
    const result = processCashflowData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if reports are missing', () => {
    const rawData: RawCashflowData = { symbol: 'TEST' };
    const result = processCashflowData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data for empty reports arrays', () => {
    const rawData: RawCashflowData = {
      symbol: 'TEST',
      annualReports: [],
      quarterlyReports: [],
    };
    const result = processCashflowData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  // Testfall 2: Korrekte Verarbeitung von Jahresdaten
  describe('Annual Data Processing', () => {
    const annualReport1: RawReport = {
      fiscalDateEnding: '2022-12-31',
      reportedCurrency: 'USD',
      operatingCashflow: '5000000000',
      capitalExpenditures: '-1000000000',
      dividendPayoutCommonStock: '-500000000',
    };
    const annualReport2: RawReport = {
      fiscalDateEnding: '2023-12-31',
      reportedCurrency: 'USD',
      operatingCashflow: '6000000000',
      capitalExpenditures: '-1200000000',
      dividendPayout: '-600000000',
    };
    const annualReport0Values: RawReport = {
        fiscalDateEnding: '2021-12-31',
        reportedCurrency: 'USD',
        operatingCashflow: '0',
        capitalExpenditures: '0',
        dividendPayoutCommonStock: '0',
    };

    const rawDataAnnual: RawCashflowData = {
      Symbol: 'TEST',
      annualReports: [annualReport0Values, annualReport1, annualReport2],
    };

    it('should process annual cashflow statement and total dividends paid correctly', () => {
      const result = processCashflowData(rawDataAnnual);

      const expectedAnnualCashflowStatement: MultiDatasetStockData = {
        labels: [2022, 2023],
        datasets: [
          { label: 'Operating Cash Flow', values: [5, 6] },
          { label: 'Capital Expenditure', values: [1, 1.2] },
          { label: 'Free Cash Flow', values: [4, 4.8] },
        ],
      };
      expect(result.annualCashflowStatement).toEqual(expectedAnnualCashflowStatement);

      const expectedAnnualTotalDividendsPaid: StockData = {
        labels: [2022, 2023],
        values: [0.5, 0.6],
      };
      expect(result.annualTotalDividendsPaid).toEqual(expectedAnnualTotalDividendsPaid);
    });

    // Korrigierter Testfall
    it('should result in empty cashflow statement if no valid reports due to missing fields', () => {
        const rawDataMissing: RawCashflowData = {
            Symbol: 'TEST',
            annualReports: [
                { fiscalDateEnding: '2023-12-31', operatingCashflow: '1000000000' } 
            ]
        };
        const result = processCashflowData(rawDataMissing);
        
        expect(result.annualCashflowStatement.labels).toEqual([]);
        result.annualCashflowStatement.datasets.forEach(ds => {
            expect(ds.values).toEqual([]);
        });
        expect(result.annualTotalDividendsPaid.labels).toEqual([]);
        expect(result.annualTotalDividendsPaid.values).toEqual([]);
    });
  });

  // Testfall 3: Korrekte Verarbeitung von Quartalsdaten
  describe('Quarterly Data Processing', () => {
    const quarterlyReport1: RawReport = {
      fiscalDateEnding: '2023-03-31',
      operatingCashflow: '1000000000',
      capitalExpenditures: '-200000000',
      dividendPayoutCommonStock: '-100000000',
    };
    const quarterlyReport2: RawReport = {
      fiscalDateEnding: '2023-06-30',
      operatingCashflow: '1200000000',
      capitalExpenditures: '-250000000',
      dividendPayout: '-120000000',
    };
     const quarterlyReport0Values: RawReport = {
      fiscalDateEnding: '2022-12-31',
      operatingCashflow: '0',
      capitalExpenditures: '0',
      dividendPayoutCommonStock: '0',
    };

    const rawDataQuarterly: RawCashflowData = {
      Symbol: 'TEST',
      quarterlyReports: [quarterlyReport0Values, quarterlyReport1, quarterlyReport2],
    };

    it('should process quarterly cashflow statement and total dividends paid correctly', () => {
      const result = processCashflowData(rawDataQuarterly);

      const expectedQuarterlyCashflowStatement: MultiDatasetStockData = {
        labels: ['Q1 2023', 'Q2 2023'],
        datasets: [
          { label: 'Operating Cash Flow', values: [1, 1.2] },
          { label: 'Capital Expenditure', values: [0.2, 0.25] },
          { label: 'Free Cash Flow', values: [0.8, 0.95] },
        ],
      };
      expect(result.quarterlyCashflowStatement).toEqual(expectedQuarterlyCashflowStatement);

      const expectedQuarterlyTotalDividendsPaid: StockData = {
        labels: ['Q1 2023', 'Q2 2023'],
        values: [0.1, 0.12],
      };
      expect(result.quarterlyTotalDividendsPaid).toEqual(expectedQuarterlyTotalDividendsPaid);
    });
  });

  // Testfall 4: Umgang mit "None", null, oder ungültigen Werten für Dividenden
  it('should handle "None", null, or invalid dividend values as 0 and apply trimData', () => {
    const rawData: RawCashflowData = {
      Symbol: 'TEST',
      annualReports: [
        { fiscalDateEnding: '2020-12-31', dividendPayoutCommonStock: 'None' },
        { fiscalDateEnding: '2021-12-31', dividendPayout: null },
        { fiscalDateEnding: '2022-12-31', dividendPayoutCommonStock: '-100000000' },
        { fiscalDateEnding: '2023-12-31', dividendPayout: '-150000000' },
      ],
    };
    const expectedAnnualDividends: StockData = {
      labels: [2022, 2023],
      values: [0.1, 0.15],
    };
    const result = processCashflowData(rawData);
    expect(result.annualTotalDividendsPaid).toEqual(expectedAnnualDividends);
  });

  // Korrigierter Testfall
  it('should filter valid reports and apply trimming correctly', () => {
    const rawData: RawCashflowData = {
      Symbol: 'TEST',
      annualReports: [
        { fiscalDateEnding: '2023-12-31', operatingCashflow: '100', capitalExpenditures: '50' },
        { fiscalDateEnding: '2022-12-31', dividendPayoutCommonStock: '-10' },
        { fiscalDateEnding: '2021-12-31', dividendPayout: '-5' },
        { fiscalDateEnding: '2020-12-31', someOtherField: '123' },
      ],
    };
    const result = processCashflowData(rawData);
    
    expect(result.annualCashflowStatement.labels).toEqual([2023]); 
    
    expect(result.annualTotalDividendsPaid.labels).toEqual([2021, 2022, 2023]);
    
    const ocfValues = result.annualCashflowStatement.datasets.find(ds => ds.label === 'Operating Cash Flow')?.values;
    expect(ocfValues).toEqual([100e-9]); 

    const dividendValues = result.annualTotalDividendsPaid.values;
    expect(dividendValues).toEqual([5e-9, 10e-9, 0]);
  });
});