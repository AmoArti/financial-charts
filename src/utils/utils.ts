// src/utils/utils.ts (Erweitert um allgemeine Helfer aus der Verarbeitung)

import { MultiDatasetStockData, StockData } from '../types/stockDataTypes'; // Importiere Typen

// --- Formatierungs- & Datumshelfer ---

/**
 * Formatiert einen Datumsstring (YYYY-MM-DD) in ein Quartalsformat (z.B. "Q1 2023").
 * Gibt bei ungültiger Eingabe den Originalstring oder einen Leerstring zurück.
 */
export const formatQuarter = (dateString: string | null | undefined): string => {
  if (!dateString || typeof dateString !== 'string') return '';
  const parts = dateString.split('-');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return dateString;
  }
  const [year, monthStr] = parts;
  const monthNum = parseInt(monthStr);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return dateString;
  }
  const quarter = Math.ceil(monthNum / 3);
  return `Q${quarter} ${year}`;
};

/**
 * Gibt ein Array der letzten 10 Jahre inklusive des aktuellen Jahres zurück.
 */
export const getLast10Years = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
};

// --- Parsing & Skalierungshelfer ---

/**
 * Wandelt einen String in eine Zahl um und skaliert ihn auf Milliarden (teilt durch 1e9).
 * Behandelt "None", "-", null und undefined als 0.
 * @param value Der zu parsende String-Wert.
 * @returns Der skalierte Zahlenwert oder 0.
 */
export const parseAndScale = (value: string | undefined | null): number => {
  if (value === undefined || value === null || value === "None" || value === "-") return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num / 1e9; // Skaliert auf Mrd.
};

/**
 * Wandelt einen String in eine Zahl um.
 * Behandelt null und undefined als 0. Behandelt "None" oder "-" NICHT speziell (wird zu NaN -> 0).
 * Nützlich für Berechnungen vor der Skalierung.
 * @param value Der zu parsende String-Wert.
 * @returns Der Zahlenwert oder 0.
 */
export const parseFloatOrZero = (value: string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};


// --- Datenmanipulationshelfer ---

/**
 * Kürzt einen einzelnen Datensatz (StockData), sodass er erst beim ersten
 * gültigen Wert (nicht 0, null oder undefined) beginnt.
 * @param labels Array mit Labels.
 * @param values Array mit Werten.
 * @returns Ein neues StockData-Objekt mit den gekürzten Daten.
 */
export const trimData = (labels: (string | number)[], values: number[]): StockData => {
  if (!Array.isArray(labels) || !Array.isArray(values)) {
    return { labels: [], values: [] };
  }
  const firstValidIndex = values.findIndex(value => value !== 0 && value !== null && value !== undefined);
  if (firstValidIndex === -1 || values.length === 0 || labels.length === 0 || labels.length !== values.length) {
    return { labels: [], values: [] };
  }
  return { labels: labels.slice(firstValidIndex), values: values.slice(firstValidIndex) };
};


/**
 * Kürzt die Daten in einem MultiDatasetStockData-Objekt, sodass sie erst
 * beim ersten Nicht-Null-Wert im *ersten* Dataset beginnen.
 * Alle Datasets werden auf dieselbe Länge gekürzt.
 * @param data Das MultiDatasetStockData-Objekt.
 * @returns Ein neues MultiDatasetStockData-Objekt mit den gekürzten Daten.
 */
export const trimMultiData = (data: MultiDatasetStockData): MultiDatasetStockData => {
  // Robuste Prüfung auf gültige Eingabedaten
  if (!data || !Array.isArray(data.labels) || !Array.isArray(data.datasets) || data.datasets.length === 0 || !data.datasets[0]?.values || !Array.isArray(data.datasets[0].values) || data.datasets[0].values.length === 0) {
    // Gib eine leere, aber gültige Struktur zurück, behalte Dataset-Struktur bei
    return { labels: [], datasets: data?.datasets?.map(ds => ({ ...(ds || {}), values: [] })) || [] };
  }
  // Finde den ersten Index im *ersten* Dataset, der nicht 0 ist.
  const firstNonZeroIndex = data.datasets[0].values.findIndex(value => value !== 0 && value !== null && value !== undefined);

  // Wenn alle Werte im ersten Dataset 0 oder ungültig sind, leere Daten zurückgeben.
  if (firstNonZeroIndex === -1) {
    return {
        labels: [],
        datasets: data.datasets.map(ds => ({ ...(ds || {}), values: [] }))
    };
  }

  // Stelle sicher, dass Labels und Values im ersten Dataset synchron sind
  if (data.labels.length !== data.datasets[0].values.length) {
     console.warn("trimMultiData: Label count doesn't match value count in first dataset.");
      return { labels: [], datasets: data.datasets.map(ds => ({ ...(ds || {}), values: [] })) };
  }

  // Kürze Labels und *alle* Datasets ab diesem Index.
  const trimmedLabels = data.labels.slice(firstNonZeroIndex);
  const trimmedDatasets = data.datasets.map(ds => {
    // Stelle sicher, dass das Dataset und dessen Werte gültig sind
    const originalValues = (ds && Array.isArray(ds.values)) ? ds.values : [];
    // Kürze nur, wenn die Originallänge mit den Labels übereinstimmt
    const trimmedValues = originalValues.length === data.labels.length ? originalValues.slice(firstNonZeroIndex) : [];
    return {
      ...(ds || {}), // Behalte andere Dataset-Eigenschaften
      values: trimmedValues,
    };
  });

  return {
      labels: trimmedLabels,
      datasets: trimmedDatasets,
  };
};

/**
 * Schneidet die Daten in einem MultiDatasetStockData-Objekt, um nur die
 * letzten N Datenpunkte zu behalten.
 * @param data Das MultiDatasetStockData-Objekt mit potenziell mehr Daten.
 * @param pointsToKeep Die Anzahl der *letzten* Datenpunkte, die behalten werden sollen.
 * @returns Ein neues MultiDatasetStockData-Objekt mit den geschnittenen Daten.
 */
export const sliceMultiDataToLastNPoints = (data: MultiDatasetStockData, pointsToKeep: number): MultiDatasetStockData => {
    // Robuste Prüfungen für data und pointsToKeep
    if (!data || !Array.isArray(data.labels) || data.labels.length === 0 || !Array.isArray(data.datasets) || pointsToKeep <= 0) {
        return {
            labels: [],
            datasets: data?.datasets?.map(ds => ({ ...(ds || {}), values: [] })) || []
        };
    }

    const totalPoints = data.labels.length;
    if (pointsToKeep >= totalPoints) {
        return data; // Keine Kürzung nötig
    }

    const startIndex = totalPoints - pointsToKeep;
    // Stelle sicher, dass startIndex nicht negativ ist
    const validStartIndex = Math.max(0, startIndex);

    const slicedLabels = data.labels.slice(validStartIndex);
    const slicedDatasets = data.datasets.map(ds => {
       const originalValues = (ds && Array.isArray(ds.values)) ? ds.values : [];
       // Slice nur, wenn Längen übereinstimmen
       const slicedValues = originalValues.length === totalPoints ? originalValues.slice(validStartIndex) : [];
        return {
            ...(ds || {}),
            values: slicedValues,
        };
    });

    return {
        labels: slicedLabels,
        datasets: slicedDatasets,
    };
};

// --- filterDataToYears Funktion (Beispielhaft, falls du sie behalten willst) ---
export const filterDataToYears = (data: StockData | null | undefined, pointsToKeep: number): StockData => {
  if (!data || !data.labels || !data.values || pointsToKeep <= 0 || data.labels.length === 0) {
    return { labels: [], values: [] };
  }
  if (pointsToKeep >= data.labels.length) {
    return data;
  }
  const startIndex = data.labels.length - pointsToKeep;
  const validStartIndex = Math.max(0, startIndex);
  return {
    labels: data.labels.slice(validStartIndex),
    values: data.values.slice(validStartIndex),
  };
};


// --- Ende utils.ts ---