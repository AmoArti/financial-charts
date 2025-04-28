// src/utils/utils.ts (Potenziell angepasst)

// MultiDatasetStockData wurde nach src/types/stockDataTypes.ts verschoben
// export interface MultiDatasetStockData { ... } // ENTFERNT

// --- Bestehende Hilfsfunktionen ---

export const formatQuarter = (dateString: string): string => {
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('-');
    if (parts.length < 2) return dateString;
    const [year, month] = parts;
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
};

export const getLast10Years = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
};

// --- trimMultiData Funktion ---
// Wird im Processing verwendet, kann hier bleiben oder dorthin verschoben werden.
// Hier belassen für jetzt. Importiert in stockDataProcessing.ts.
import { MultiDatasetStockData } from '../types/stockDataTypes'; // Importiere den Typ

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


// --- Slice/Filter Funktionen (werden in Home.tsx verwendet) ---
interface StockDataForFilter { // Einfache Struktur für Filterung
    labels: (string | number)[];
    values: number[];
}

// Wird aktuell nicht mehr direkt verwendet, seit Daten im Hook getrimmt werden?
// Könnte entfernt werden, wenn nicht in Home.tsx oder anderswo benötigt.
// Belasse es vorerst zur Sicherheit hier.
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

// Wird in Home.tsx verwendet
export const sliceMultiDataToLastNPoints = (data: MultiDatasetStockData, pointsToKeep: number): MultiDatasetStockData => {
    // Robuste Prüfungen für data und pointsToKeep
    if (!data || !data.labels || data.labels.length === 0 || !data.datasets || pointsToKeep <= 0) {
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