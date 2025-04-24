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
  
  
  // --- HINZUGEFÜGT: trimMultiData Funktion ---
  /**
   * Kürzt die Daten in einem MultiDatasetStockData-Objekt, sodass sie erst
   * beim ersten Nicht-Null-Wert im *ersten* Dataset beginnen.
   * Alle Datasets werden auf dieselbe Länge gekürzt.
   * @param data Das MultiDatasetStockData-Objekt.
   * @returns Ein neues MultiDatasetStockData-Objekt mit den gekürzten Daten.
   */
  export const trimMultiData = (data: MultiDatasetStockData): MultiDatasetStockData => {
      if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets[0].values) {
          return { labels: [], datasets: [] };
      }
  
      // Finde den ersten Index im *ersten* Dataset (z.B. Revenue), der nicht 0 ist.
      const firstNonZeroIndex = data.datasets[0].values.findIndex(value => value !== 0);
  
      // Wenn alle Werte im ersten Dataset 0 sind oder keine Werte vorhanden sind, leere Daten zurückgeben.
      if (firstNonZeroIndex === -1) {
          return { labels: [], datasets: [] };
      }
  
      // Kürze Labels und *alle* Datasets ab diesem Index.
      return {
          labels: data.labels.slice(firstNonZeroIndex),
          datasets: data.datasets.map(ds => ({
              ...ds,
              values: ds.values.slice(firstNonZeroIndex)
          }))
      };
  };
  
  
  // --- Originale filterDataToYears Funktion (Beachte: Diese funktioniert NICHT direkt mit MultiDatasetStockData) ---
  // Sie wird im ChartModal nicht mehr benötigt, wenn die Filterung/Kürzung im Hook passiert.
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
  // --- Ende Anpassungen ---