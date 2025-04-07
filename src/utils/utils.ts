// src/utils/utils.ts

// Deine ursprünglichen Funktionen:
export const formatQuarter = (dateString: string): string => {
    const [year, month] = dateString.split('-');
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
};

export const getLast10Years = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
};


// --- HINZUGEFÜGT: Filterfunktion und Interface ---

// Interface für die Datenstruktur, die gefiltert wird
// (Stelle sicher, dass dies mit deiner StockData-Definition übereinstimmt oder importiere sie)
// Wenn du StockData aus useStockData exportierst, könntest du auch das hier importieren.
interface StockDataForFilter {
    labels: (string | number)[];
    values: number[];
}

/**
 * Filtert ein StockData-Objekt, um nur die letzten N Datenpunkte zu behalten.
 * @param data Das zu filternde StockData-Objekt (oder null/undefined).
 * @param pointsToKeep Die Anzahl der letzten Datenpunkte, die behalten werden sollen.
 * @returns Ein neues StockData-Objekt mit den gefilterten Daten oder leere Arrays bei Fehlern/ungültiger Eingabe.
 */
export const filterDataToYears = (data: StockDataForFilter | null | undefined, pointsToKeep: number): StockDataForFilter => {
    // Handle null/undefined input oder ungültige Daten
    if (!data || !data.labels || !data.values || pointsToKeep <= 0 || data.labels.length === 0) {
        return { labels: [], values: [] }; // Gib leere Struktur zurück
    }

    // Wenn mehr Punkte angefordert werden als vorhanden sind, gib Original zurück
    if (pointsToKeep >= data.labels.length) {
        return data;
    }

    // Berechne Startindex, um die letzten 'pointsToKeep' Elemente zu bekommen
    const startIndex = data.labels.length - pointsToKeep;
    return {
        labels: data.labels.slice(startIndex),
        values: data.values.slice(startIndex),
    };
};
// --- Ende Hinzufügung ---