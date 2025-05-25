// src/utils/processing/dividendProcessing.test.ts

import { processDividendHistory } from './dividendProcessing';
import type { RawDividendHistoryData, StockData, RawDividend } from '../../types/stockDataTypes';

describe('processDividendHistory', () => {
  const emptyStockData: StockData = { labels: [], values: [] };

  const initialExpectedResult = {
    annualDPS: emptyStockData,
    quarterlyDPS: emptyStockData,
  };

  // Testfall 1: Leere Eingabedaten
  it('should return initial empty data if raw data is undefined', () => {
    const rawData = undefined;
    const result = processDividendHistory(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if raw data is null', () => {
    const rawData = null;
    const result = processDividendHistory(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data if dividend history data array is missing', () => {
    const rawData: RawDividendHistoryData = {}; // Kein 'data'-Array
    const result = processDividendHistory(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  it('should return initial empty data for an empty dividend history data array', () => {
    const rawData: RawDividendHistoryData = {
      data: [],
    };
    const result = processDividendHistory(rawData);
    expect(result).toEqual(initialExpectedResult);
  });

  // Testfall 2: Korrekte Aggregation und Verarbeitung
  describe('Data Aggregation and Processing', () => {
    const dividendHistory: RawDividend[] = [
      // 2022 Daten
      { ex_dividend_date: '2022-03-15', amount: '0.10' }, // Q1 2022
      { ex_dividend_date: '2022-06-15', amount: '0.10' }, // Q2 2022
      { ex_dividend_date: '2022-09-15', amount: '0.10' }, // Q3 2022
      { ex_dividend_date: '2022-12-15', amount: '0.10' }, // Q4 2022
      // 2023 Daten
      { ex_dividend_date: '2023-03-10', amount: '0.12' }, // Q1 2023
      { ex_dividend_date: '2023-03-20', amount: '0.03' }, // Q1 2023 (zweite Zahlung im Quartal)
      { ex_dividend_date: '2023-06-10', amount: '0.15' }, // Q2 2023
      // Test für TrimData (führende Nullen)
      { ex_dividend_date: '2021-12-01', amount: '0' },    // Wird ignoriert da Betrag 0
      { ex_dividend_date: '2021-09-01', amount: '-0.5'},  // Wird ignoriert da Betrag negativ
    ];

    const rawData: RawDividendHistoryData = {
      data: dividendHistory,
    };

    it('should correctly aggregate annual DPS and sort by year', () => {
      const result = processDividendHistory(rawData);
      const expectedAnnualDPS: StockData = {
        labels: [2022, 2023], // 2021 wird ignoriert, da Beträge 0 oder negativ
        values: [0.40, 0.30],  // 2022: 0.1*4 = 0.40; 2023: 0.12+0.03+0.15 = 0.30
      };
      // Erwartet, dass die Werte auf eine bestimmte Anzahl von Nachkommastellen gerundet werden,
      // falls parseFloatOrZero oder die Addition zu leichten Ungenauigkeiten führen.
      expect(result.annualDPS.labels).toEqual(expectedAnnualDPS.labels);
      result.annualDPS.values.forEach((val, index) => {
        expect(val).toBeCloseTo(expectedAnnualDPS.values[index], 5); // 5 Nachkommastellen Toleranz
      });
    });

    it('should correctly aggregate quarterly DPS and sort chronologically', () => {
      const result = processDividendHistory(rawData);
      const expectedQuarterlyDPS: StockData = {
        labels: ['Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023', 'Q2 2023'],
        values: [0.10, 0.10, 0.10, 0.10, 0.15, 0.15], // Q1 2023: 0.12+0.03 = 0.15
      };
      expect(result.quarterlyDPS.labels).toEqual(expectedQuarterlyDPS.labels);
       result.quarterlyDPS.values.forEach((val, index) => {
        expect(val).toBeCloseTo(expectedQuarterlyDPS.values[index], 5);
      });
    });
  });

  // Testfall 3: Umgang mit ungültigen oder fehlenden Daten in einzelnen Dividendeneinträgen
  describe('Handling Invalid Dividend Entries', () => {
    const dividendHistoryInvalid: RawDividend[] = [
      { ex_dividend_date: '2023-03-15', amount: '0.10' }, // Gültig
      { ex_dividend_date: '2023-06-15', amount: undefined }, // Ungültiger Betrag
      { ex_dividend_date: undefined, amount: '0.20' },     // Ungültiges Datum
      { ex_dividend_date: '2023-09-15', amount: 'None' },   // Ungültiger Betrag (String "None")
      { ex_dividend_date: '2023-12-15', amount: '0.05' }, // Gültig
      { ex_dividend_date: '2023-12-20', amount: '0' },      // Betrag 0, wird ignoriert
      { ex_dividend_date: '2024-01-15', amount: '-0.1' },   // Negativer Betrag, wird ignoriert
      { ex_dividend_date: 'invalid-date-string', amount: '0.10' }, // Ungültiges Datumsformat
    ];

    const rawDataInvalid: RawDividendHistoryData = {
      data: dividendHistoryInvalid,
    };

    it('should skip invalid entries and correctly process valid ones', () => {
      const result = processDividendHistory(rawDataInvalid);
      const expectedAnnualDPS: StockData = {
        labels: [2023],
        values: [0.15], // Nur 0.10 + 0.05 aus 2023
      };
      expect(result.annualDPS.labels).toEqual(expectedAnnualDPS.labels);
      result.annualDPS.values.forEach((val, index) => {
        expect(val).toBeCloseTo(expectedAnnualDPS.values[index], 5);
      });


      const expectedQuarterlyDPS: StockData = {
        labels: ['Q1 2023', 'Q4 2023'],
        values: [0.10, 0.05],
      };
      expect(result.quarterlyDPS.labels).toEqual(expectedQuarterlyDPS.labels);
       result.quarterlyDPS.values.forEach((val, index) => {
        expect(val).toBeCloseTo(expectedQuarterlyDPS.values[index], 5);
      });
    });
  });

  // Testfall 4: trimData Anwendung
  it('should apply trimData correctly to annual and quarterly DPS', () => {
    const dividendHistoryForTrim: RawDividend[] = [
      // Diese Einträge sollten zu führenden Nullen in den aggregierten Daten führen (vor trimData)
      // Die Funktion aggregateDividends ignoriert aber bereits Beträge von 0.
      // Um trimData wirklich zu testen, bräuchten wir ein Szenario, wo *nach* Aggregation
      // ein gültiger, aber früher Eintrag zu einer 0 führt, was bei DPS selten ist,
      // es sei denn, es gibt Jahre/Quartale ganz ohne Dividenden zwischen Perioden mit Dividenden.
      // Die aktuelle Implementierung von aggregateDividends und parseFloatOrZero(amount) stellt sicher,
      // dass nur >0 Beträge aggregiert werden. trimData kommt dann ins Spiel, wenn die *aggregierten*
      // Werte anfangs 0 sind.
      // Beispiel: Keine Dividenden in 2021, dann Dividenden in 2022, 2023.
      // aggregateDividends würde 2021 gar nicht in yearMap aufnehmen.
      // trimData wird also auf bereits "vor-gefilterte" Labels/Values angewendet.

      // Testen wir einen Fall, wo die ersten aggregierten Werte 0 wären, falls die Logik anders wäre.
      // Da aber nur positive Beträge aggregiert werden, ist es schwer, trimData hier isoliert zu testen,
      // ohne die interne `aggregateDividends` Logik zu umgehen oder sehr spezifische Daten zu konstruieren,
      // die aggregateDividends zu einem Ergebnis mit führenden Nullen bringt (was es nicht tut).
      // Der Test konzentriert sich daher darauf, dass die Sortierung korrekt ist und
      // dass, wenn die ersten *gültigen* Dividenden erst später beginnen, die Labels korrekt sind.

      { ex_dividend_date: '2022-03-15', amount: '0.0' },    // Q1 2022 -> ignoriert von aggregateDividends
      { ex_dividend_date: '2023-03-15', amount: '0.10' }, // Q1 2023
      { ex_dividend_date: '2023-06-15', amount: '0.10' }, // Q2 2023
    ];
     const rawDataForTrim: RawDividendHistoryData = {
      data: dividendHistoryForTrim,
    };
    const result = processDividendHistory(rawDataForTrim);

    const expectedAnnualDPS: StockData = {
      labels: [2023],
      values: [0.20],
    };
    expect(result.annualDPS).toEqual(expectedAnnualDPS);

    const expectedQuarterlyDPS: StockData = {
      labels: ['Q1 2023', 'Q2 2023'],
      values: [0.10, 0.10],
    };
    expect(result.quarterlyDPS).toEqual(expectedQuarterlyDPS);
  });
});