// src/utils/utils.ts

// Interface für Daten mit mehreren Datensätzen
export interface MultiDatasetStockData {
    labels: (string | number)[];
    datasets: {
      label: string;
      values: number[];
      backgroundColor?: string; // Optional für spätere Verwendung
      borderColor?: string; // Optional für spätere Verwendung
    }[];
  }
  
  // Deine ursprünglichen Funktionen:
  export const formatQuarter = (dateString: string): string => {
      if (!dateString || typeof dateString !== 'string') return ''; // Fehlerbehandlung
      const parts = dateString.split('-');
      if (parts.length < 2) return dateString; // Gib Original zurück, wenn Format unerwartet
      const [year, month] = parts;
      const quarter = Math.ceil(parseInt(month) / 3);
      return `Q${quarter} ${year}`;
  };
  
  export const getLast10Years = (): number[] => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
  };
  
  
  // --- trimMultiData Funktion ---
  /**
   * Kürzt die Daten in einem MultiDatasetStockData-Objekt, sodass sie erst
   * beim ersten Nicht-Null-Wert im *ersten* Dataset beginnen.
   * Alle Datasets werden auf dieselbe Länge gekürzt.
   * @param data Das MultiDatasetStockData-Objekt.
   * @returns Ein neues MultiDatasetStockData-Objekt mit den gekürzten Daten.
   */
  export const trimMultiData = (data: MultiDatasetStockData): MultiDatasetStockData => {
      if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets[0]?.values || data.datasets[0].values.length === 0) {
          return { labels: [], datasets: [] };
      }
  
      // Finde den ersten Index im *ersten* Dataset (z.B. Revenue), der nicht 0 ist.
      const firstNonZeroIndex = data.datasets[0].values.findIndex(value => value !== 0);
  
      // Wenn alle Werte im ersten Dataset 0 sind oder keine Werte vorhanden sind, leere Daten zurückgeben.
      if (firstNonZeroIndex === -1) {
          // Wichtig: Gib leere Datasets zurück, aber behalte die Struktur bei
          return {
               labels: [],
               datasets: data.datasets.map(ds => ({ ...ds, values: [] }))
          };
      }
  
      // Kürze Labels und *alle* Datasets ab diesem Index.
      return {
          labels: data.labels.slice(firstNonZeroIndex),
          datasets: data.datasets.map(ds => ({
              ...ds,
              // Stelle sicher, dass values existiert, bevor slice aufgerufen wird
              values: ds.values ? ds.values.slice(firstNonZeroIndex) : [],
          })),
      };
  };
  
  
  // --- Originale filterDataToYears Funktion (wird nicht mehr direkt im Modal benötigt) ---
  interface StockDataForFilter {
      labels: (string | number)[];
      values: number[];
  }
  
  export const filterDataToYears = (data: StockDataForFilter | null | undefined, pointsToKeep: number): StockDataForFilter => {
      if (!data || !data.labels || !data.values || pointsToKeep <= 0 || data.labels.length === 0) {
          return { labels: [], values: [] };
      }
      if (pointsToKeep >= data.labels.length) {
          return data;
      }
      const startIndex = data.labels.length - pointsToKeep;
      return {
          labels: data.labels.slice(startIndex),
          values: data.values.slice(startIndex),
      };
  };
  
  // --- NEUE sliceMultiDataToLastNPoints Funktion ---
  /**
   * Schneidet die Daten in einem MultiDatasetStockData-Objekt, um nur die
   * letzten N Datenpunkte zu behalten.
   * @param data Das MultiDatasetStockData-Objekt mit potenziell mehr Daten.
   * @param pointsToKeep Die Anzahl der *letzten* Datenpunkte, die behalten werden sollen.
   * @returns Ein neues MultiDatasetStockData-Objekt mit den geschnittenen Daten.
   */
  export const sliceMultiDataToLastNPoints = (data: MultiDatasetStockData, pointsToKeep: number): MultiDatasetStockData => {
      // Robuste Prüfungen für data und pointsToKeep
      if (!data || !data.labels || data.labels.length === 0 || !data.datasets || pointsToKeep <= 0) {
          // Gib eine leere, aber gültige Struktur zurück
          return {
              labels: [],
              datasets: data?.datasets?.map(ds => ({ ...ds, values: [] })) || [] // Behalte Dataset-Labels etc.
          };
      }
  
      const totalPoints = data.labels.length;
      if (pointsToKeep >= totalPoints) {
          return data; // Keine Kürzung nötig
      }
  
      const startIndex = totalPoints - pointsToKeep;
  
      return {
          labels: data.labels.slice(startIndex),
          datasets: data.datasets.map(ds => ({
              ...ds,
              // Stelle sicher, dass values existiert, bevor slice aufgerufen wird
              values: ds.values ? ds.values.slice(startIndex) : [],
          })),
      };
  };
  // --- Ende utils.ts ---