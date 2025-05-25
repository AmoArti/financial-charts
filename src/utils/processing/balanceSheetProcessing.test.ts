// src/utils/processing/balanceSheetProcessing.test.ts

import { processBalanceSheetData } from './balanceSheetProcessing';
import type { RawBalanceSheetData, StockData, RawReport } from '../../types/stockDataTypes';

describe('processBalanceSheetData', () => {
  const emptyStockData: StockData = { labels: [], values: [] };

  const initialExpectedResult = {
    annualSharesOutstanding: emptyStockData,
    quarterlySharesOutstanding: emptyStockData,
    annualDebtToEquity: emptyStockData,
    quarterlyDebtToEquity: emptyStockData,
  };

  // Testfall 1: Leere Eingabedaten
  it('should return initial empty data if raw data is undefined', () => {
    const rawData = undefined;
    const result = processBalanceSheetData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if raw data is null', () => {
    const rawData = null;
    const result = processBalanceSheetData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if reports are missing', () => {
    const rawData: RawBalanceSheetData = { symbol: 'TEST' };
    const result = processBalanceSheetData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data for empty reports arrays', () => {
    const rawData: RawBalanceSheetData = {
      symbol: 'TEST',
      annualReports: [],
      quarterlyReports: [],
    };
    const result = processBalanceSheetData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  // Testfall 2: Korrekte Verarbeitung von Jahresdaten
  describe('Annual Data Processing', () => {
    const annualReport1_2022: RawReport = { // Renamed for clarity
      fiscalDateEnding: '2022-12-31',
      commonStockSharesOutstanding: '1000000000', // 1B -> 1000M
      totalLiabilities: '5000000000',           // 5B
      totalShareholderEquity: '10000000000',     // 10B -> D/E = 0.5
    };
    const annualReport2_2023: RawReport = { // Renamed for clarity
      fiscalDateEnding: '2023-12-31',
      commonStockSharesOutstanding: '1100000000', // 1.1B -> 1100M
      totalLiabilities: '6000000000',           // 6B
      totalShareholderEquity: '12000000000',     // 12B -> D/E = 0.5
    };
    const annualReport_2021_0Values: RawReport = { // Renamed for clarity
        fiscalDateEnding: '2021-12-31',
        commonStockSharesOutstanding: '0', // Shares = 0
        totalLiabilities: '100',
        totalShareholderEquity: '1',       // D/E = 100
    };
     const annualReport_2020_NegativeEquity: RawReport = { // Renamed for clarity
      fiscalDateEnding: '2020-12-31',
      commonStockSharesOutstanding: '900000000', // Shares = 900M
      totalLiabilities: '5000000000',
      totalShareholderEquity: '-1000000000', // Negatives Eigenkapital -> D/E wird 0
    };

    const rawDataAnnual: RawBalanceSheetData = {
      Symbol: 'TEST',
      // Sorted by year for clarity in reasoning, function sorts them anyway
      annualReports: [annualReport_2020_NegativeEquity, annualReport_2021_0Values, annualReport1_2022, annualReport2_2023],
    };

    it('should process annual shares outstanding and debt-to-equity correctly', () => {
      const result = processBalanceSheetData(rawDataAnnual);

      // Initial labels from valid reports: [2020, 2021, 2022, 2023]
      // Shares Values (scaled): [900, 0, 1000, 1100]
      // trimData([2020,2021,2022,2023], [900,0,1000,1100]) -> labels: [2020,2021,2022,2023], values: [900,0,1000,1100] (first non-zero at index 0)
      expect(result.annualSharesOutstanding.labels).toEqual([2020, 2021, 2022, 2023]);
      expect(result.annualSharesOutstanding.values).toEqual([900, 0, 1000, 1100]);

      // D/E Values for [2020, 2021, 2022, 2023]:
      // 2020: Neg Equity -> 0
      // 2021: 100 / 1 = 100
      // 2022: 5B / 10B = 0.5
      // 2023: 6B / 12B = 0.5
      // Raw D/E Values: [0, 100, 0.5, 0.5]
      // trimData([2020,2021,2022,2023], [0, 100, 0.5, 0.5]) -> labels: [2021,2022,2023], values: [100, 0.5, 0.5] (trims leading 0 for 2020)
      const expectedAnnualDE: StockData = {
        labels: [2021, 2022, 2023],
        values: [100, 0.5, 0.5],
      };
      result.annualDebtToEquity.values.forEach((val, i) => {
        expect(val).toBeCloseTo(expectedAnnualDE.values[i], 2);
      });
      expect(result.annualDebtToEquity.labels).toEqual(expectedAnnualDE.labels);
    });

    // KORRIGIERTER TESTFALL
    it('should handle missing fields in annual reports gracefully', () => {
        const rawDataMissing: RawBalanceSheetData = {
            Symbol: 'TEST',
            annualReports: [ // Sorted by year for clarity
                { fiscalDateEnding: '2022-12-31', totalLiabilities: '100', totalShareholderEquity: '100' }, // Shares-Feld fehlt
                { fiscalDateEnding: '2023-12-31', commonStockSharesOutstanding: '1000000' } // D/E-Felder fehlen
            ]
        };
        const result = processBalanceSheetData(rawDataMissing);
        // Initial labels from valid reports: [2022, 2023]
        // Shares Values for [2022, 2023]: [0 (fehlt), 1 (skaliert)]
        // trimData([2022,2023], [0,1]) -> labels: [2023], values: [1]
        expect(result.annualSharesOutstanding.labels).toEqual([2023]);
        expect(result.annualSharesOutstanding.values).toEqual([1]);

        // D/E Values for [2022, 2023]: [1 (100/100), 0 (fehlt)]
        // trimData([2022,2023], [1,0]) -> labels: [2022,2023], values: [1,0]
        expect(result.annualDebtToEquity.labels).toEqual([2022, 2023]);
        expect(result.annualDebtToEquity.values).toEqual([1, 0]);
    });
  });

  // Testfall 3: Korrekte Verarbeitung von Quartalsdaten
  describe('Quarterly Data Processing', () => {
    const quarterlyReport1_Q1_2023: RawReport = { // Renamed
      fiscalDateEnding: '2023-03-31',
      commonStockSharesOutstanding: '50000000',
      totalLiabilities: '200000000',
      totalShareholderEquity: '400000000',
    };
    const quarterlyReport2_Q2_2023: RawReport = { // Renamed
      fiscalDateEnding: '2023-06-30',
      commonStockSharesOutstanding: '55000000',
      totalLiabilities: '250000000',
      totalShareholderEquity: '500000000',
    };
     const quarterlyReport_Q4_2022_0Values: RawReport = { // Renamed
      fiscalDateEnding: '2022-12-31',
      commonStockSharesOutstanding: '0',
      totalLiabilities: '0',
      totalShareholderEquity: '1', // D/E = 0
    };

    const rawDataQuarterly: RawBalanceSheetData = {
      Symbol: 'TEST',
      quarterlyReports: [quarterlyReport_Q4_2022_0Values, quarterlyReport1_Q1_2023, quarterlyReport2_Q2_2023],
    };

    it('should process quarterly shares and D/E ratio correctly', () => {
      const result = processBalanceSheetData(rawDataQuarterly);
      // Initial Labels: ['Q4 2022', 'Q1 2023', 'Q2 2023']
      // Shares Values: [0, 50, 55] -> Trimmed: Labels ['Q1 2023', 'Q2 2023'], Values [50, 55]
      const expectedQuarterlyShares: StockData = {
        labels: ['Q1 2023', 'Q2 2023'],
        values: [50, 55],
      };
      expect(result.quarterlySharesOutstanding).toEqual(expectedQuarterlyShares);

      // D/E Values: [0, 0.5, 0.5] -> Trimmed: Labels ['Q1 2023', 'Q2 2023'], Values [0.5, 0.5]
      const expectedQuarterlyDE: StockData = {
        labels: ['Q1 2023', 'Q2 2023'],
        values: [0.5, 0.5],
      };
      result.quarterlyDebtToEquity.values.forEach((val, i) => {
        expect(val).toBeCloseTo(expectedQuarterlyDE.values[i], 2);
      });
      expect(result.quarterlyDebtToEquity.labels).toEqual(expectedQuarterlyDE.labels);
    });
  });

  // Testfall 4: D/E Ratio mit totalShareholderEquity <= 0
  it('should return D/E as 0 if totalShareholderEquity is zero or negative, and trim correctly', () => {
    const rawData: RawBalanceSheetData = {
      Symbol: 'TEST',
      annualReports: [ // Sorted by year
        { fiscalDateEnding: '2022-12-31', totalLiabilities: '1000', totalShareholderEquity: '-100' }, // D/E = 0
        { fiscalDateEnding: '2023-12-31', totalLiabilities: '1000', totalShareholderEquity: '0' },    // D/E = 0
      ],
    };
    const result = processBalanceSheetData(rawData);
    // Initial Labels: [2022, 2023]
    // D/E Values: [0, 0]
    // trimData([2022,2023], [0,0]) -> labels: [], values: []
    expect(result.annualDebtToEquity.labels).toEqual([]);
    expect(result.annualDebtToEquity.values).toEqual([]);
  });

  // KORRIGIERTER TESTFALL
  it('should filter valid reports based on shares OR D/E fields and trim correctly', () => {
    const rawData: RawBalanceSheetData = {
      Symbol: 'TEST',
      annualReports: [ // Sorted by year
        { fiscalDateEnding: '2021-12-31', someOtherField: 'abc' }, // Ungültig
        { fiscalDateEnding: '2022-12-31', totalLiabilities: '100', totalShareholderEquity: '50' }, // Nur D/E-Felder
        { fiscalDateEnding: '2023-12-31', commonStockSharesOutstanding: '1000000' }, // Nur Shares
      ],
    };
    const result = processBalanceSheetData(rawData);
    // Initial valid labels: [2022, 2023]

    // Shares Values for [2022, 2023]: [0 (fehlt), 1 (1Mio/1e6)]
    // trimData([2022,2023], [0,1]) -> labels: [2023], values: [1]
    expect(result.annualSharesOutstanding.labels).toEqual([2023]);
    expect(result.annualSharesOutstanding.values[0]).toBeCloseTo(1); // 1Mio / 1e6

    // D/E Values for [2022, 2023]: [2 (100/50), 0 (fehlt)]
    // trimData([2022,2023], [2,0]) -> labels: [2022,2023], values: [2,0]
    expect(result.annualDebtToEquity.labels).toEqual([2022, 2023]);
    expect(result.annualDebtToEquity.values[0]).toBeCloseTo(2);
    expect(result.annualDebtToEquity.values[1]).toBeCloseTo(0);
  });
});