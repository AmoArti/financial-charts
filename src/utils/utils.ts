// src/utils/utils.ts (Korrigierte Version)

// MultiDatasetStockData wurde nach src/types/stockDataTypes.ts verschoben
// export interface MultiDatasetStockData { ... } // ENTFERNT

// --- Bestehende Hilfsfunktionen ---

// *** KORRIGIERTE VERSION ***
export const formatQuarter = (dateString: string): string => {
    if (!dateString || typeof dateString !== 'string') return ''; // Grundlegende Prüfung

    const parts = dateString.split('-');
    // Prüfe, ob wir mindestens Jahr UND Monat haben
    if (parts.length < 2 || !parts[0] || !parts[1]) {
         return dateString; // Gib Original zurück, wenn Format unvollständig ist
    }

    const [year, monthStr] = parts;

    // Prüfe, ob der Monatsteil eine gültige Zahl ist
    const monthNum = parseInt(monthStr);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return dateString; // Gib Original zurück, wenn Monat ungültig ist
    }

    // Jetzt können wir sicher das Quartal berechnen
    const quarter = Math.ceil(monthNum / 3);
    return `Q${quarter} ${year}`;
};
// *** ENDE KORRIGIERTE VERSION ***


export const getLast10Years = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
};


// --- trimMultiData Funktion ---
// Wird im Processing verwendet, kann hier bleiben oder dorthin verschoben werden.
// Hier belassen für jetzt. Importiert in stockDataProcessing.ts.
// Wichtig: Importiere den Typ aus der neuen Datei!
import { MultiDatasetStockData } from '../types/stockDataTypes';

/**
 * Kürzt die Daten in einem MultiDatasetStockData-Objekt, sodass sie erst
 * beim ersten Nicht-Null-Wert im *ersten* Dataset beginnen.
 * Alle Datasets werden auf dieselbe Länge gekürzt.
 * @param data Das MultiDatasetStockData-Objekt.
 * @returns Ein neues MultiDatasetStockData-Objekt mit den gekürzten Daten.
 */
export const trimMultiData = (data: MultiDatasetStockData): MultiDatasetStockData => {
    if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets[0]?.values || data.datasets[0].values.length === 0) {
        // Stelle sicher, dass die Struktur erhalten bleibt, auch wenn Labels leer sind
        return { labels: [], datasets: data?.datasets?.map(ds => ({ ...ds, values: [] })) || [] };
    }
    // Finde den ersten Index im *ersten* Dataset (z.B. Revenue), der nicht 0 ist.
    const firstNonZeroIndex = data.datasets[0].values.findIndex(value => value !== 0);

    // Wenn alle Werte im ersten Dataset 0 sind oder keine Werte vorhanden sind, leere Daten zurückgeben.
    if (firstNonZeroIndex === -1) {
        return {
             labels: [], // Leere Labels
             datasets: data.datasets.map(ds => ({ ...ds, values: [] })) // Leere Werte in allen Datasets
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


// --- filterDataToYears Funktion (potenziell ungenutzt, aber noch vorhanden) ---
// Interne Interface-Definition für diese Funktion
interface StockDataForFilter {
    labels: (string | number)[];
    values: number[];
}

export const filterDataToYears = (data: StockDataForFilter | null | undefined, pointsToKeep: number): StockDataForFilter => {
    if (!data || !data.labels || !data.values || pointsToKeep <= 0 || data.labels.length === 0) {
        return { labels: [], values: [] };
    }
    if (pointsToKeep >= data.labels.length) {
        return data; // Keine Kürzung nötig, wenn pointsToKeep >= Länge ist
    }
    const startIndex = data.labels.length - pointsToKeep;
    // Stelle sicher, dass startIndex nicht negativ ist (sollte nicht passieren, aber sicher ist sicher)
    const validStartIndex = Math.max(0, startIndex);
    return {
        labels: data.labels.slice(validStartIndex),
        values: data.values.slice(validStartIndex),
    };
};


// --- sliceMultiDataToLastNPoints Funktion (wird in Home.tsx verwendet) ---
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
     // Stelle sicher, dass startIndex nicht negativ ist
     const validStartIndex = Math.max(0, startIndex);

    return {
        labels: data.labels.slice(validStartIndex),
        datasets: data.datasets.map(ds => ({
            ...ds,
            // Stelle sicher, dass values existiert, bevor slice aufgerufen wird
            values: ds.values ? ds.values.slice(validStartIndex) : [],
        })),
    };
};

// --- Ende utils.ts ---