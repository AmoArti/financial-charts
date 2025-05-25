// src/utils/processing/incomeProcessing.test.ts

import { processIncomeData } from './incomeProcessing';
import type { RawIncomeStatementData, StockData, MultiDatasetStockData, RawReport } from '../../types/stockDataTypes';

describe('processIncomeData', () => {
  const emptyStockData: StockData = { labels: [], values: [] };
  const emptyMultiDatasetStockData: MultiDatasetStockData = { labels: [], datasets: [] };

  const initialExpectedResult = {
    annualRevenue: emptyStockData,
    quarterlyRevenue: emptyStockData,
    annualIncomeStatement: emptyMultiDatasetStockData,
    quarterlyIncomeStatement: emptyMultiDatasetStockData,
    annualMargins: emptyMultiDatasetStockData,
    quarterlyMargins: emptyMultiDatasetStockData,
    latestAnnualGrossMargin: null,
    latestAnnualOperatingMargin: null,
  };

  // Testfall 1: Leere Eingabedaten
  it('should return initial empty data if raw data is undefined', () => {
    const rawData = undefined;
    const result = processIncomeData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if raw data is null', () => {
    const rawData = null;
    const result = processIncomeData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if reports are missing', () => {
    const rawData: RawIncomeStatementData = { Symbol: 'TEST' }; // Keine annualReports oder quarterlyReports
    const result = processIncomeData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data for empty reports arrays', () => {
    const rawData: RawIncomeStatementData = {
      Symbol: 'TEST',
      annualReports: [],
      quarterlyReports: [],
    };
    const result = processIncomeData(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  // Testfall 2: Korrekte Verarbeitung von Jahresdaten
  describe('Annual Data Processing', () => {
    const annualReport1: RawReport = {
      fiscalDateEnding: '2022-12-31',
      reportedCurrency: 'USD',
      totalRevenue: '10000000000', // 10B
      grossProfit: '4000000000',   // 4B
      operatingIncome: '2000000000',// 2B
      netIncome: '1000000000',    // 1B
    };
    const annualReport2: RawReport = {
      fiscalDateEnding: '2023-12-31',
      reportedCurrency: 'USD',
      totalRevenue: '12000000000', // 12B
      grossProfit: '5400000000',   // 5.4B (45% GM)
      operatingIncome: '3000000000',// 3B (25% OM)
      netIncome: '1500000000',    // 1.5B (12.5% NM)
    };
     const annualReport0Values: RawReport = { // Um trimMultiData zu testen
      fiscalDateEnding: '2021-12-31',
      reportedCurrency: 'USD',
      totalRevenue: '0', // Wird von parseAndScale zu 0, aber für Margenberechnung ist der String "0" wichtig
      grossProfit: '0',
      operatingIncome: '0',
      netIncome: '0',
    };


    const rawDataAnnual: RawIncomeStatementData = {
      Symbol: 'TEST',
      annualReports: [annualReport0Values, annualReport1, annualReport2], 
    };

    it('should process annual income statement, revenue, and margins correctly', () => {
      const result = processIncomeData(rawDataAnnual);

      const expectedAnnualIncomeStatement: MultiDatasetStockData = {
        labels: [2022, 2023], 
        datasets: [
          { label: 'Revenue', values: [10, 12] },
          { label: 'Gross Profit', values: [4, 5.4] },
          { label: 'Operating Income', values: [2, 3] },
          { label: 'Net Income', values: [1, 1.5] },
        ],
      };
      expect(result.annualIncomeStatement).toEqual(expectedAnnualIncomeStatement);

      const expectedAnnualRevenue: StockData = {
        labels: [2022, 2023],
        values: [10, 12],
      };
      expect(result.annualRevenue).toEqual(expectedAnnualRevenue);

      const expectedAnnualMargins: MultiDatasetStockData = {
        labels: [2022, 2023],
        datasets: [
          { label: 'Gross Margin', values: [40, 45] },        
          { label: 'Operating Margin', values: [20, 25] },  
          { label: 'Net Income Margin', values: [10, 12.5] },
        ],
      };
      // Compare float values with a certain precision
      result.annualMargins.datasets.forEach((ds, index) => {
        expect(ds.label).toEqual(expectedAnnualMargins.datasets[index].label);
        ds.values.forEach((val, i) => {
            expect(val).toBeCloseTo(expectedAnnualMargins.datasets[index].values[i]);
        });
      });
      expect(result.annualMargins.labels).toEqual(expectedAnnualMargins.labels);


      expect(result.latestAnnualGrossMargin).toBeCloseTo(45);
      expect(result.latestAnnualOperatingMargin).toBeCloseTo(25);
    });

    // ANGEPASSTER TESTFALL
    it('should handle missing fields in annual reports gracefully leading to empty margins after trim', () => {
        const rawDataMissingFields: RawIncomeStatementData = {
            Symbol: 'TEST',
            annualReports: [
                { fiscalDateEnding: '2023-12-31', totalRevenue: '1000000000' } // Andere Felder fehlen
            ]
        };
        const result = processIncomeData(rawDataMissingFields);
        
        const grossProfitDataset = result.annualIncomeStatement.datasets.find(ds => ds.label === 'Gross Profit');
        // Da im annualReport nur totalRevenue vorhanden ist, wird grossProfit, operatingIncome, netIncome von parseAndScale zu 0.
        // trimMultiData wird dann für das annualIncomeStatement das [0,0,0,0] Dataset nicht entfernen, wenn totalRevenue > 0 ist.
        // Es sei denn, der erste Wert (Revenue) wäre auch 0.
        // Hier ist Revenue 1 (skaliert). Gross Profit etc. sind 0.
        expect(grossProfitDataset?.values[0]).toBe(0);


        const grossMarginDataset = result.annualMargins.datasets.find(ds => ds.label === 'Gross Margin');
        // Margen: calculateMargins gibt null für GM, OM, NM zurück, wenn die entsprechenden Profit-Felder fehlen.
        // In processIncomeData wird `m?.gm ?? 0` verwendet.
        // Wenn also das einzige annualReport dazu führt, dass alle Margen-Werte [0,0,0] sind,
        // und trimMultiData auf dieses angewendet wird, wird `firstNonZeroIndex` für `[0]` als `-1` bewertet.
        // Das führt dazu, dass trimMultiData leere Labels und leere Values-Arrays zurückgibt.
        expect(grossMarginDataset?.values).toEqual([]); 
        expect(result.annualMargins.labels).toEqual([]); 

        expect(result.latestAnnualGrossMargin).toBeNull(); 
    });
  });

  // Testfall 3: Korrekte Verarbeitung von Quartalsdaten
  describe('Quarterly Data Processing', () => {
    const quarterlyReport1: RawReport = {
      fiscalDateEnding: '2023-03-31', 
      reportedCurrency: 'USD',
      totalRevenue: '2000000000', 
      grossProfit: '800000000',  
      operatingIncome: '400000000',
      netIncome: '200000000',   
    };
    const quarterlyReport2: RawReport = {
      fiscalDateEnding: '2023-06-30', 
      reportedCurrency: 'USD',
      totalRevenue: '2500000000', 
      grossProfit: '1125000000', 
      operatingIncome: '625000000', 
      netIncome: '312500000',   
    };
     const quarterlyReport0Values: RawReport = { 
      fiscalDateEnding: '2022-12-31', 
      reportedCurrency: 'USD',
      totalRevenue: '0',
      grossProfit: '0',
      operatingIncome: '0',
      netIncome: '0',
    };

    const rawDataQuarterly: RawIncomeStatementData = {
      Symbol: 'TEST',
      quarterlyReports: [quarterlyReport0Values, quarterlyReport1, quarterlyReport2],
    };

    it('should process quarterly income statement, revenue, and margins correctly', () => {
      const result = processIncomeData(rawDataQuarterly);

      const expectedQuarterlyIncomeStatement: MultiDatasetStockData = {
        labels: ['Q1 2023', 'Q2 2023'], 
        datasets: [
          { label: 'Revenue', values: [2, 2.5] },
          { label: 'Gross Profit', values: [0.8, 1.125] },
          { label: 'Operating Income', values: [0.4, 0.625] },
          { label: 'Net Income', values: [0.2, 0.3125] },
        ],
      };
      expect(result.quarterlyIncomeStatement).toEqual(expectedQuarterlyIncomeStatement);

      const expectedQuarterlyRevenue: StockData = {
        labels: ['Q1 2023', 'Q2 2023'],
        values: [2, 2.5],
      };
      expect(result.quarterlyRevenue).toEqual(expectedQuarterlyRevenue);

      const expectedQuarterlyMargins: MultiDatasetStockData = {
        labels: ['Q1 2023', 'Q2 2023'],
        datasets: [
          { label: 'Gross Margin', values: [40, 45] },
          { label: 'Operating Margin', values: [20, 25] },
          { label: 'Net Income Margin', values: [10, 12.5] },
        ],
      };
       result.quarterlyMargins.datasets.forEach((ds, index) => {
        expect(ds.label).toEqual(expectedQuarterlyMargins.datasets[index].label);
        ds.values.forEach((val, i) => {
            expect(val).toBeCloseTo(expectedQuarterlyMargins.datasets[index].values[i]);
        });
      });
      expect(result.quarterlyMargins.labels).toEqual(expectedQuarterlyMargins.labels);
    });
  });

   // Testfall 4: Margenberechnung mit Null-Umsatz
  it('should return null for margins if totalRevenue is 0 or invalid, leading to empty margins after trim', () => {
    const rawData: RawIncomeStatementData = {
      Symbol: 'TEST',
      annualReports: [
        {
          fiscalDateEnding: '2023-12-31',
          totalRevenue: '0', 
          grossProfit: '1000', // irrelevant für Marge bei 0 Umsatz
          operatingIncome: '500',
          netIncome: '100'
        },
        {
          fiscalDateEnding: '2022-12-31',
          totalRevenue: 'None', 
          grossProfit: '1000',
          operatingIncome: '500',
          netIncome: '100'
        }
      ],
    };
    const result = processIncomeData(rawData);
    // Wenn totalRevenue '0' oder 'None' ist, gibt calculateMargins für alle Margen 'null' zurück.
    // In processIncomeData wird `m?.gm ?? 0` verwendet.
    // Wenn also alle annualReports dazu führen, dass alle Margen-Werte [0,0,0...] sind,
    // und trimMultiData auf dieses angewendet wird, wird `firstNonZeroIndex` für `[0,0,...]` als `-1` bewertet.
    // Das führt dazu, dass trimMultiData leere Labels und leere Values-Arrays zurückgibt.
    expect(result.annualMargins.datasets.every(ds => ds.values.length === 0)).toBe(true);
    expect(result.annualMargins.labels).toEqual([]);
    expect(result.latestAnnualGrossMargin).toBeNull();
    expect(result.latestAnnualOperatingMargin).toBeNull();
  });
});