// src/utils/utils.test.ts

// Importiere die Funktionen und Typen, die du testen möchtest
import {
    formatQuarter,
    sliceMultiDataToLastNPoints,
    // MultiDatasetStockData, // Wird unten direkt als Typ verwendet
    getLast10Years,
    trimMultiData,
    filterDataToYears, // Stelle sicher, dass dies in utils.ts exportiert wird
    // StockDataForFilter // Wird unten direkt als Typ verwendet
  } from './utils';
import type { MultiDatasetStockData, StockData as StockDataForFilter } from '../types/stockDataTypes'; // Importiere Typen explizit

describe('formatQuarter', () => {
  it('should format a date string from Q1 correctly', () => {
    const dateString = '2023-03-15';
    const expectedOutput = 'Q1 2023';
    const result = formatQuarter(dateString);
    expect(result).toBe(expectedOutput);
  });

  it('should format a date string from Q4 correctly', () => {
    const dateString = '2024-11-01';
    const expectedOutput = 'Q4 2024';
    const result = formatQuarter(dateString);
    expect(result).toBe(expectedOutput);
  });

  it('should handle single-digit months correctly (Q2)', () => {
    const dateString = '2023-04-05'; // April ist Q2
    const expectedOutput = 'Q2 2023';
    const result = formatQuarter(dateString);
    expect(result).toBe(expectedOutput);
  });

  it('should return an empty string for null input', () => {
    const dateString = null as any;
    const expectedOutput = '';
    const result = formatQuarter(dateString);
    expect(result).toBe(expectedOutput);
  });

  it('should return an empty string for empty string input', () => {
    const dateString = '';
    const expectedOutput = '';
    const result = formatQuarter(dateString);
    expect(result).toBe(expectedOutput);
  });

  it('should return the original string if format is unexpected', () => {
    const dateString = '20230315';
    const expectedOutput = '20230315';
    const result = formatQuarter(dateString);
    expect(result).toBe(expectedOutput);
  });

  // --- Edge Cases ---
  it('should handle month 01 correctly', () => {
    expect(formatQuarter('2023-01-31')).toBe('Q1 2023');
  });

  it('should handle month 12 correctly', () => {
    expect(formatQuarter('2023-12-01')).toBe('Q4 2023');
  });

  it('should return original string for incomplete date parts', () => {
    expect(formatQuarter('2023-')).toBe('2023-');
    expect(formatQuarter('2023')).toBe('2023');
  });

  it('should return original string for non-numeric month part', () => {
    expect(formatQuarter('2023-XX')).toBe('2023-XX');
  });

  it('should handle undefined input', () => {
    expect(formatQuarter(undefined as any)).toBe('');
  });
}); // Ende describe formatQuarter


describe('sliceMultiDataToLastNPoints', () => {
  const sampleData: MultiDatasetStockData = {
    labels: ['2020', '2021', '2022', '2023', '2024'],
    datasets: [
      { label: 'Revenue', values: [10, 20, 0, 30, 40] },
      { label: 'Profit', values: [1, 2, 0, 3, 4] },
    ]
  };

  it('should slice data to keep the last 3 points', () => {
    const pointsToKeep = 3;
    const expectedOutput: MultiDatasetStockData = {
      labels: ['2022', '2023', '2024'],
      datasets: [
        { label: 'Revenue', values: [0, 30, 40] },
        { label: 'Profit', values: [0, 3, 4] },
      ]
    };
    const result = sliceMultiDataToLastNPoints(sampleData, pointsToKeep);
    expect(result).toEqual(expectedOutput);
  });

  it('should return the original data if pointsToKeep is greater than or equal to length', () => {
    const pointsToKeep = 5;
    const result = sliceMultiDataToLastNPoints(sampleData, pointsToKeep);
    expect(result).toEqual(sampleData);
  });

  it('should return empty data structure for 0 pointsToKeep', () => {
    const pointsToKeep = 0;
    const expectedOutput: MultiDatasetStockData = {
       labels: [],
       datasets: [
           { label: 'Revenue', values: [] },
           { label: 'Profit', values: [] },
         ]
    };
    const result = sliceMultiDataToLastNPoints(sampleData, pointsToKeep);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle empty input data gracefully', () => {
     const emptyData: MultiDatasetStockData = { labels: [], datasets: [] };
     const pointsToKeep = 3;
     const expectedOutput: MultiDatasetStockData = { labels: [], datasets: [] };
     const result = sliceMultiDataToLastNPoints(emptyData, pointsToKeep);
     expect(result).toEqual(expectedOutput);
   });

   it('should handle input data with empty datasets gracefully', () => {
       const dataWithEmptyDatasets: MultiDatasetStockData = {
           labels: ['2020', '2021'],
           datasets: [
               { label: 'Revenue', values: [] },
               { label: 'Profit', values: [] }
           ]
        };
        const pointsToKeep = 1;
        const expectedOutput: MultiDatasetStockData = {
           labels: ['2021'],
           datasets: [
                { label: 'Revenue', values: [] },
                { label: 'Profit', values: [] }
            ]
         };
        const result = sliceMultiDataToLastNPoints(dataWithEmptyDatasets, pointsToKeep);
        expect(result).toEqual(expectedOutput);
    });

    // --- Edge Cases ---
    it('should return empty structure for null data input', () => {
      const result = sliceMultiDataToLastNPoints(null as any, 3);
      expect(result).toEqual({ labels: [], datasets: [] });
    });

    it('should return empty structure for data with null labels', () => {
      const data: MultiDatasetStockData = {
        labels: null as any,
        datasets: [{ label: 'Test', values: [1, 2] }]
      };
      const result = sliceMultiDataToLastNPoints(data, 1);
      expect(result).toEqual({ labels: [], datasets: [{ label: 'Test', values: [] }] });
    });

     it('should return empty structure for data with null datasets', () => {
       const data: MultiDatasetStockData = {
         labels: ['2023', '2024'],
         datasets: null as any
       };
       const result = sliceMultiDataToLastNPoints(data, 1);
       expect(result).toEqual({ labels: [], datasets: [] });
     });

     it('should return empty structure for negative pointsToKeep', () => {
        const pointsToKeep = -1;
        const expectedOutput: MultiDatasetStockData = {
           labels: [],
           datasets: [
               { label: 'Revenue', values: [] },
               { label: 'Profit', values: [] },
             ]
        };
        const result = sliceMultiDataToLastNPoints(sampleData, pointsToKeep); // Reuse sampleData
        expect(result).toEqual(expectedOutput);
      });

      it('should keep only the last point if pointsToKeep is 1', () => {
          const pointsToKeep = 1;
           const expectedOutput: MultiDatasetStockData = {
             labels: ['2024'],
             datasets: [
               { label: 'Revenue', values: [40] },
               { label: 'Profit', values: [4] },
             ]
           };
          const result = sliceMultiDataToLastNPoints(sampleData, pointsToKeep); // Reuse sampleData
          expect(result).toEqual(expectedOutput);
       });
}); // Ende describe sliceMultiDataToLastNPoints


describe('getLast10Years', () => {
  it('should return an array of 10 years', () => {
    const result = getLast10Years();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(10);
  });

  it('should end with the current year', () => {
    const currentYear = new Date().getFullYear();
    const result = getLast10Years();
    expect(result[result.length - 1]).toBe(currentYear);
  });

  it('should start with the year 9 years before the current year', () => {
    const currentYear = new Date().getFullYear();
    const expectedStartYear = currentYear - 9;
    const result = getLast10Years();
    expect(result[0]).toBe(expectedStartYear);
  });

  // No parameter edge cases applicable here
}); // Ende describe getLast10Years


describe('trimMultiData', () => {
  it('should trim leading zeros based on the first dataset', () => {
    const data: MultiDatasetStockData = {
      labels: ['2019', '2020', '2021', '2022'],
      datasets: [
        { label: 'Revenue', values: [0, 0, 10, 20] },
        { label: 'Profit', values: [1, 2, 3, 4] },
      ]
    };
    const expected: MultiDatasetStockData = {
      labels: ['2021', '2022'],
      datasets: [
        { label: 'Revenue', values: [10, 20] },
        { label: 'Profit', values: [3, 4] },
      ]
    };
    const result = trimMultiData(data);
    expect(result).toEqual(expected);
  });

  it('should return empty structure if first dataset contains only zeros', () => {
    const data: MultiDatasetStockData = {
      labels: ['2020', '2021', '2022'],
      datasets: [
        { label: 'Revenue', values: [0, 0, 0] },
        { label: 'Profit', values: [1, 2, 3] },
      ]
    };
    const expected: MultiDatasetStockData = {
      labels: [],
      datasets: [
        { label: 'Revenue', values: [] },
        { label: 'Profit', values: [] },
      ]
    };
    const result = trimMultiData(data);
    expect(result).toEqual(expected);
  });

  it('should return original data if no leading zeros in first dataset', () => {
    const data: MultiDatasetStockData = {
      labels: ['2021', '2022'],
      datasets: [
        { label: 'Revenue', values: [10, 20] },
        { label: 'Profit', values: [0, 5] },
      ]
    };
    const result = trimMultiData(data);
    expect(result).toEqual(data);
  });

  it('should handle empty datasets array', () => {
    const data: MultiDatasetStockData = {
      labels: ['2021', '2022'],
      datasets: []
    };
    const expected: MultiDatasetStockData = { labels: [], datasets: [] }; // Funktion gibt { labels: [], datasets: [] } zurück, da data.datasets.length === 0
    const result = trimMultiData(data);
    expect(result).toEqual(expected);
  });

  it('should handle datasets with empty values array in first dataset', () => {
    const data: MultiDatasetStockData = {
      labels: ['2021', '2022'], // Labels vorhanden
      datasets: [{ label: 'Revenue', values: [] }] // Werte im ersten Dataset leer
    };
    // Erwartet, dass Labels und das Dataset-Struktur beibehalten werden, aber Werte bleiben leer oder werden geleert,
    // da data.datasets[0].values.length === 0
    const expected: MultiDatasetStockData = {
        labels: [], // Wird geleert, da values im ersten Dataset leer sind und firstNonZeroIndex -1 ist
        datasets: [{ label: 'Revenue', values: [] }]
    };
    const result = trimMultiData(data);
    expect(result).toEqual(expected);
  });

  // --- Edge Cases ---
  it('should return empty structure for null data input', () => {
    const result = trimMultiData(null as any);
    expect(result).toEqual({ labels: [], datasets: [] });
  });

  // ANGEPASSTER TESTFALL
  it('should return empty values if first dataset values are not zero but labels are empty and counts mismatch', () => {
    const data: MultiDatasetStockData = {
      labels: [], // Labels sind leer
      datasets: [ { label: 'Revenue', values: [10, 20] } ] // Werte vorhanden, aber Länge passt nicht zu Labels
    };
    const expected: MultiDatasetStockData = { // NEUE ERWARTUNG
        labels: [],
        // Die Funktion leert die 'values', da data.labels.length (0) !== data.datasets[0].values.length (2)
        // und die Warnung "Label count doesn't match value count in first dataset" wird ausgegeben.
        datasets: [{ label: 'Revenue', values: [] }]
    };
    const result = trimMultiData(data);
    expect(result).toEqual(expected);
  });

  it('should not trim if zeros are not leading in the first dataset', () => {
     const data: MultiDatasetStockData = {
       labels: ['2020', '2021', '2022'],
       datasets: [
         { label: 'Revenue', values: [10, 0, 20] },
         { label: 'Profit', values: [1, 0, 3] },
       ]
     };
     const result = trimMultiData(data);
     expect(result).toEqual(data);
   });
}); // Ende describe trimMultiData


describe('filterDataToYears', () => {
  const sampleData: StockDataForFilter = {
    labels: [2020, 2021, 2022, 2023, 2024],
    values: [10, 20, 30, 40, 50]
  };

  it('should filter data to keep the last N points (years)', () => {
    const pointsToKeep = 3;
    const expected: StockDataForFilter = {
      labels: [2022, 2023, 2024],
      values: [30, 40, 50]
    };
    const result = filterDataToYears(sampleData, pointsToKeep);
    expect(result).toEqual(expected);
  });

  it('should return original data if pointsToKeep is greater or equal to length', () => {
    const pointsToKeep = 6;
    const result = filterDataToYears(sampleData, pointsToKeep);
    expect(result).toEqual(sampleData);
  });

  it('should return empty data if pointsToKeep is 0', () => {
    const pointsToKeep = 0;
    const expected: StockDataForFilter = { labels: [], values: [] };
    const result = filterDataToYears(sampleData, pointsToKeep);
    expect(result).toEqual(expected);
  });

  it('should handle empty input data gracefully', () => {
     const emptyData: StockDataForFilter = { labels: [], values: [] };
     const pointsToKeep = 3;
     const expected: StockDataForFilter = { labels: [], values: [] };
     const result = filterDataToYears(emptyData, pointsToKeep);
     expect(result).toEqual(expected);
   });

   // --- Edge Cases ---
   it('should return empty structure for null data input', () => {
     const result = filterDataToYears(null as any, 3);
     expect(result).toEqual({ labels: [], values: [] });
   });

   it('should handle data with null labels', () => {
     const data: StockDataForFilter = { labels: null as any, values: [1, 2] };
     const result = filterDataToYears(data, 1);
     expect(result).toEqual({ labels: [], values: [] });
   });

    it('should handle data with null values', () => {
      const data: StockDataForFilter = { labels: [2023, 2024], values: null as any };
      const result = filterDataToYears(data, 1);
      expect(result).toEqual({ labels: [], values: [] });
    });

    it('should return empty structure for negative pointsToKeep', () => {
      const pointsToKeep = -2;
      const expected: StockDataForFilter = { labels: [], values: [] };
      const result = filterDataToYears(sampleData, pointsToKeep); // Reuse sampleData
      expect(result).toEqual(expected);
    });

     it('should keep only the last point if pointsToKeep is 1', () => {
         const pointsToKeep = 1;
         const expected: StockDataForFilter = { labels: [2024], values: [50] }; // Use last element of sampleData
         const result = filterDataToYears(sampleData, pointsToKeep); // Reuse sampleData
         expect(result).toEqual(expected);
      });
}); // Ende describe filterDataToYears