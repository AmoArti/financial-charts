// src/utils/processing/earningsProcessing.test.ts

import { processEarningsData } from './earningsProcessing';
import type { RawEarningsData, StockData } from '../../types/stockDataTypes'; // Importiere RawEarningsData

describe('processEarningsData', () => {
  // Testfall 1: Leere Eingabedaten
  it('should return empty EPS data if raw data is undefined', () => {
    const rawData = undefined;
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual({ labels: [], values: [] });
    expect(result.quarterlyEPS).toEqual({ labels: [], values: [] });
  });

  it('should return empty EPS data if raw data is null', () => {
    const rawData = null;
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual({ labels: [], values: [] });
    expect(result.quarterlyEPS).toEqual({ labels: [], values: [] });
  });

  it('should return empty EPS data if earnings reports are missing', () => {
    const rawData: RawEarningsData = { symbol: 'TEST' }; // Keine annualEarnings oder quarterlyEarnings
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual({ labels: [], values: [] });
    expect(result.quarterlyEPS).toEqual({ labels: [], values: [] });
  });

  it('should return empty EPS data for empty earnings reports arrays', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      annualEarnings: [],
      quarterlyEarnings: [],
    };
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual({ labels: [], values: [] });
    expect(result.quarterlyEPS).toEqual({ labels: [], values: [] });
  });

  // Testfall 2: Korrekte Verarbeitung von Jahres-EPS
  it('should process annual EPS data correctly and sort by year', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      annualEarnings: [
        { fiscalDateEnding: '2023-12-31', reportedEPS: '2.50' },
        { fiscalDateEnding: '2021-12-31', reportedEPS: '1.50' },
        { fiscalDateEnding: '2022-12-31', reportedEPS: '2.00' },
      ],
    };
    const expectedAnnualEPS: StockData = {
      labels: [2021, 2022, 2023],
      values: [1.50, 2.00, 2.50],
    };
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual(expectedAnnualEPS);
    expect(result.quarterlyEPS).toEqual({ labels: [], values: [] }); // Keine Quartalsdaten erwartet
  });

  // Testfall 3: Korrekte Verarbeitung von Quartals-EPS
  it('should process quarterly EPS data correctly and sort by date', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      quarterlyEarnings: [
        { fiscalDateEnding: '2023-03-31', reportedEPS: '0.50' }, // Q1 2023
        { fiscalDateEnding: '2022-12-31', reportedEPS: '0.70' }, // Q4 2022
        { fiscalDateEnding: '2023-06-30', reportedEPS: '0.60' }, // Q2 2023
      ],
    };
    const expectedQuarterlyEPS: StockData = {
      labels: ['Q4 2022', 'Q1 2023', 'Q2 2023'],
      values: [0.70, 0.50, 0.60],
    };
    const result = processEarningsData(rawData);
    expect(result.quarterlyEPS).toEqual(expectedQuarterlyEPS);
    expect(result.annualEPS).toEqual({ labels: [], values: [] }); // Keine Jahresdaten erwartet
  });

  // Testfall 4: Umgang mit ungültigen Werten und trimData
  it('should handle "None", null, or invalid EPS values as 0 and apply trimData for annual EPS', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      annualEarnings: [
        { fiscalDateEnding: '2019-12-31', reportedEPS: 'None' },    // Wird 0
        { fiscalDateEnding: '2020-12-31', reportedEPS: undefined }, // Wird 0
        { fiscalDateEnding: '2021-12-31', reportedEPS: null },      // Wird 0
        { fiscalDateEnding: '2022-12-31', reportedEPS: '1.00' },
        { fiscalDateEnding: '2023-12-31', reportedEPS: '1.50' },
      ],
    };
    // trimData entfernt die führenden Nullen
    const expectedAnnualEPS: StockData = {
      labels: [2022, 2023],
      values: [1.00, 1.50],
    };
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual(expectedAnnualEPS);
  });

  it('should handle "None", null, or invalid EPS values as 0 and apply trimData for quarterly EPS', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      quarterlyEarnings: [
        { fiscalDateEnding: '2022-09-30', reportedEPS: 'None' },     // Q3 2022 -> 0
        { fiscalDateEnding: '2022-12-31', reportedEPS: undefined },  // Q4 2022 -> 0
        { fiscalDateEnding: '2023-03-31', reportedEPS: '0.50' },     // Q1 2023
        { fiscalDateEnding: '2023-06-30', reportedEPS: '0.60' },     // Q2 2023
      ],
    };
    // trimData entfernt die führenden Nullen
    const expectedQuarterlyEPS: StockData = {
      labels: ['Q1 2023', 'Q2 2023'],
      values: [0.50, 0.60],
    };
    const result = processEarningsData(rawData);
    expect(result.quarterlyEPS).toEqual(expectedQuarterlyEPS);
  });

  // Testfall 5: Nur EPS wird verarbeitet (DPS-Felder sind in earningsProcessing nicht mehr relevant)
  it('should only process EPS and not look for DPS fields', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      annualEarnings: [
        { fiscalDateEnding: '2023-12-31', reportedEPS: '2.50', reportedDPS: '1.00' }, // Angenommen, es gäbe ein DPS-Feld
      ],
       quarterlyEarnings: [
        { fiscalDateEnding: '2023-03-31', reportedEPS: '0.50', reportedDPS: '0.25' },
      ],
    };
    const result = processEarningsData(rawData);
    // Überprüfe, ob DPS-bezogene Felder im Ergebnis leer sind oder nicht existieren,
    // da processEarningsData sie nicht mehr befüllen sollte.
    // Da ProcessedEarningsData keine DPS-Felder mehr hat, reicht die EPS-Prüfung.
    expect(result.annualEPS.values).toEqual([2.50]);
    expect(result.quarterlyEPS.values).toEqual([0.50]);
  });

   // Testfall 6: Fehlende fiscalDateEnding oder reportedEPS
  it('should skip entries with missing fiscalDateEnding or reportedEPS', () => {
    const rawData: RawEarningsData = {
      symbol: 'TEST',
      annualEarnings: [
        { reportedEPS: '2.50' }, // Keine fiscalDateEnding
        { fiscalDateEnding: '2022-12-31' }, // Keine reportedEPS
        { fiscalDateEnding: '2023-12-31', reportedEPS: '3.00'},
      ],
      quarterlyEarnings: [
        { reportedEPS: '0.50' }, // Keine fiscalDateEnding
        { fiscalDateEnding: '2023-03-31' }, // Keine reportedEPS
        { fiscalDateEnding: '2023-06-30', reportedEPS: '0.75'},
      ]
    };
    const expectedAnnualEPS: StockData = {
      labels: [2023],
      values: [3.00],
    };
    const expectedQuarterlyEPS: StockData = {
      labels: ['Q2 2023'],
      values: [0.75],
    };
    const result = processEarningsData(rawData);
    expect(result.annualEPS).toEqual(expectedAnnualEPS);
    expect(result.quarterlyEPS).toEqual(expectedQuarterlyEPS);
  });

});