// src/utils/processing/dividendProcessing.ts (KORRIGIERT für API-Struktur)
import { StockData } from '../../types/stockDataTypes';
import { formatQuarter, trimData, parseFloatOrZero } from '../utils'; // Importiere Helfer

// Definition des Rückgabetyps für Klarheit
export interface ProcessedDividendData {
  annualDPS: StockData;
  quarterlyDPS: StockData;
}

// Hilfsfunktion zum Aggregieren der Dividenden pro Periode
const aggregateDividends = (dividendHistory: any[]): { yearMap: Record<string, number>, quarterMap: Record<string, number> } => {
    const yearMap: Record<string, number> = {};
    const quarterMap: Record<string, number> = {};

    if (!Array.isArray(dividendHistory)) {
        console.warn("Dividend history is not an array:", dividendHistory);
        return { yearMap, quarterMap };
    }

    for (const dividend of dividendHistory) {
        // *** KORRIGIERTE Feldnamen ***
        const dateStr = dividend?.ex_dividend_date; // Ex-Datum verwenden
        const amountStr = dividend?.amount;         // Betrag heißt 'amount'
        // *** Ende Korrektur ***

        if (!dateStr || typeof dateStr !== 'string' || amountStr === undefined || amountStr === null) {
            continue;
        }

        const amount = parseFloatOrZero(amountStr); // Nutze parseFloatOrZero für Robustheit
        if (isNaN(amount) || amount <= 0) { // Ignoriere 0 oder negative Dividenden oder NaN
            continue;
        }

        // Extrahiere Jahr und Quartal
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) { // Prüfe auf gültiges Datum
            continue;
        }
        const year = date.getFullYear();
        // Nutze existierenden Helfer, stelle sicher, dass er auch hier '' zurückgibt bei Fehler
        const quarter = formatQuarter(dateStr);
        // Fallback, falls formatQuarter Originalstring zurückgibt oder leer ist
        if (!quarter || !quarter.startsWith('Q')) {
             continue;
        }


        // Addiere zum Jahreswert hinzu
        yearMap[year] = (yearMap[year] || 0) + amount;

        // Addiere zum Quartalswert hinzu
        quarterMap[quarter] = (quarterMap[quarter] || 0) + amount;
    }

    return { yearMap, quarterMap };
};


export const processDividendHistory = (dividendData: any): ProcessedDividendData => {

  let result: ProcessedDividendData = {
    annualDPS: { labels: [], values: [] },
    quarterlyDPS: { labels: [], values: [] },
  };

  // *** KORRIGIERTER Zugriff auf das Array ***
  const history = dividendData?.data; // Zugriff auf 'data' statt 'dividends'
  // *** Ende Korrektur ***

  if (!history || !Array.isArray(history)) {
    // Nachricht angepasst
    console.warn("Keine gültige Dividendenhistorie im erwarteten Format ('data'-Array) gefunden:", dividendData);
    return result; // Gibt leeres Ergebnis zurück
  }

  // Rufe die Aggregationsfunktion auf
  const { yearMap, quarterMap } = aggregateDividends(history);

  // --- Jahresdaten aufbereiten ---
  const annualLabelsRaw = Object.keys(yearMap).map(year => parseInt(year)).sort((a, b) => a - b);
  const annualValuesRaw = annualLabelsRaw.map(year => yearMap[String(year)]);

  if (annualLabelsRaw.length > 0) {
      // Wende trimData an, um ggf. führende Jahre ohne Dividenden zu entfernen
      result.annualDPS = trimData(annualLabelsRaw, annualValuesRaw);
  }


  // --- Quartalsdaten aufbereiten ---
  // Sortiere Quartale chronologisch (Q1 2023, Q2 2023, ...)
  const quarterlyLabelsRaw = Object.keys(quarterMap).sort((a, b) => {
      const [qA, yA] = a.split(' ');
      const [qB, yB] = b.split(' ');
      // Prüfe ob Jahr und Quartal extrahiert werden konnten
      const yearA = parseInt(yA);
      const yearB = parseInt(yB);
      const quarterNumA = parseInt(qA?.substring(1));
      const quarterNumB = parseInt(qB?.substring(1));

      // Fallback für ungültige Formate
      if(isNaN(yearA) || isNaN(yearB) || isNaN(quarterNumA) || isNaN(quarterNumB)) return 0;

      if (yearA !== yearB) return yearA - yearB;
      return quarterNumA - quarterNumB;
  });
  const quarterlyValuesRaw = quarterlyLabelsRaw.map(quarter => quarterMap[quarter]);

   if (quarterlyLabelsRaw.length > 0) {
       // Wende trimData an, um ggf. führende Quartale ohne Dividenden zu entfernen
       result.quarterlyDPS = trimData(quarterlyLabelsRaw, quarterlyValuesRaw);
   }

  return result;
};
// --- Ende dividendProcessing.ts ---