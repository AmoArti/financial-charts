// src/utils/stockDataProcessing.ts (Refactored - V4: Alle Verarbeitungen ausgelagert)
import {
  CompanyInfo,
  KeyMetrics,
  RawApiData,
  UseStockDataResult // Behalte den vollen Typ für den Rückgabewert
} from '../types/stockDataTypes';
// Importiere ausgelagerte Verarbeitungsfunktionen
import { processIncomeData } from './processing/incomeProcessing';
import { processEarningsData } from './processing/earningsProcessing';
import { processCashflowData } from './processing/cashflowProcessing';
import { processBalanceSheetData } from './processing/balanceSheetProcessing';

// --- Hilfsfunktionen für KeyMetrics Formatierung (bleiben hier) ---
// Diese Funktionen formatieren die Daten aus 'overview' und 'quote' für die KeyMetrics Anzeige
const formatMetric = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const stringValue = String(value);
    const num = parseFloat(stringValue);
    return isNaN(num) ? null : stringValue; // Gibt den Original-String zurück, wenn es eine Zahl ist
};
const formatPercentage = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    // Ersetze '%' nur, wenn es tatsächlich vorkommt, um Doppelung zu vermeiden
    const stringValue = String(value).includes('%') ? String(value).replace('%', '') : String(value);
    const numValue = parseFloat(stringValue);
    if (isNaN(numValue)) return null;
    // Alpha Vantage liefert DividendYield oft als Dezimal (0.015), ChangePercent als String mit % (-0.5%)
    if (String(value).includes('%')) {
        // Bereits ein %-Zeichen vorhanden -> nur formatieren
        return `${numValue.toFixed(2)}%`;
    } else if (Math.abs(numValue) > 0 && Math.abs(numValue) <= 1) {
        // Wahrscheinlich Dezimalzahl für Rendite/Yield (z.B. 0.015) -> * 100
        return `${(numValue * 100).toFixed(2)}%`;
    } else {
        // Wahrscheinlich schon eine Prozentzahl (wie Marge aus calculateMargins) oder eine Zahl > 1
         // Behandle als Zahl und füge % hinzu (Fallback)
        return `${numValue.toFixed(2)}%`;
    }
};
const formatPriceChange = (value: string | number | null | undefined): string | null => {
    if (value === undefined || value === null || value === "None" || value === "-") return null;
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num.toFixed(2); // Formatieren auf 2 Nachkommastellen
};
// Diese Funktion formatiert die *bereits berechneten* Margen (als Prozentzahl)
const formatMarginForDisplay = (value: number | null): string | null => {
    if (value === null || isNaN(value) || !isFinite(value)) return null;
    return `${value.toFixed(2)}%`; // Nur auf 2 Nachkommastellen formatieren und % anhängen
};

// --- Hauptfunktion zur Verarbeitung aller Rohdaten ---
// Definiere den Rückgabetyp basierend auf UseStockDataResult ohne die Hook-Metadaten
type ProcessedStockDataResult = Omit<UseStockDataResult, 'fetchData' | 'loading' | 'error' | 'progress'>;

export const processStockData = (rawData: RawApiData, ticker: string): ProcessedStockDataResult => {
  // Destructure alle erwarteten Rohdaten-Teile
  const { income, earnings, cashflow, overview, quote, balanceSheet } = rawData;

  // --- Grundlegende Fehlerprüfung der essentiellen Daten ---
  if (!overview?.Symbol) {
    // Wenn Overview fehlt, können wir kaum sinnvolle Infos anzeigen -> Fehler
    console.error("Processing Error: Overview data or Symbol missing!", overview);
    throw new Error(`Keine Unternehmensinformationen (OVERVIEW) für Ticker "${ticker}" verfügbar.`);
  }
  const globalQuote = quote?.['Global Quote'];
  if (!globalQuote) {
     // Quote kann fehlen, wir geben eine Warnung aus und zeigen N/A an
     console.warn(`Keine Global Quote Daten für Ticker "${ticker}" verfügbar. Quote data:`, quote);
  }

  // --- Datenverarbeitung durch Aufruf der importierten Funktionen ---
  // Rufe alle Verarbeitungsfunktionen auf. Sie geben leere Strukturen zurück, wenn ihre Eingabedaten fehlen.
  const incomeProcessed = processIncomeData(income);
  const earningsProcessed = processEarningsData(earnings);
  const cashflowProcessed = processCashflowData(cashflow);
  const balanceSheetProcessed = processBalanceSheetData(balanceSheet);

  // --- Company Info zusammenstellen ---
  // Nutzt Daten aus 'overview' und 'quote'
  const currentPrice = globalQuote?.['05. price'];
  const companyInfo: CompanyInfo = {
     Name: overview?.Name || ticker, // Fallback auf Ticker, wenn Name fehlt
     Industry: overview?.Industry || 'N/A',
     Address: overview?.Address || 'N/A',
     MarketCapitalization: overview?.MarketCapitalization || 'N/A', // Wird in Komponente formatiert
     LastSale: currentPrice ? parseFloat(currentPrice).toFixed(2) : 'N/A', // Formatierter Preis
  };

  // --- Key Metrics zusammenstellen ---
  // Nutzt Daten aus 'overview', 'quote' und das Ergebnis von 'incomeProcessed'
  const rawChange = globalQuote?.['09. change'];
  const rawChangePercent = globalQuote?.['10. change percent'];
  const numChange = parseFloat(rawChange || ''); // Wird NaN wenn rawChange ungültig ist

  const keyMetrics: KeyMetrics = {
      // Werte aus Overview API
      peRatio: formatMetric(overview?.PERatio),
      psRatio: formatMetric(overview?.PriceToSalesRatioTTM),
      pbRatio: formatMetric(overview?.PriceToBookRatio),
      evToEbitda: formatMetric(overview?.EVToEBITDA),
      dividendYield: formatPercentage(overview?.DividendYield),
      // Werte aus Quote API
      priceChange: formatPriceChange(rawChange), // Wird null, wenn Quote fehlt oder 'change' fehlt/ungültig
      priceChangePercent: formatPercentage(rawChangePercent), // Wird null, wenn Quote fehlt oder 'change percent' fehlt/ungültig
      isPositiveChange: !isNaN(numChange) && numChange >= 0, // False, wenn Quote fehlt/ungültig ist
      // Werte aus Income Statement Verarbeitung
      grossMargin: formatMarginForDisplay(incomeProcessed.latestAnnualGrossMargin),
      operatingMargin: formatMarginForDisplay(incomeProcessed.latestAnnualOperatingMargin),
   };

  // --- Rückgabe aller verarbeiteten Daten ---
  // Kombiniere die Ergebnisse der einzelnen Verarbeitungsfunktionen und die hier erstellten Infos/Metriken
  return {
    companyInfo,
    keyMetrics,
    // Ergebnisse aus den importierten Funktionen:
    annualRevenue: incomeProcessed.annualRevenue,
    quarterlyRevenue: incomeProcessed.quarterlyRevenue,
    annualEPS: earningsProcessed.annualEPS,
    quarterlyEPS: earningsProcessed.quarterlyEPS,
    annualIncomeStatement: incomeProcessed.annualIncomeStatement,
    quarterlyIncomeStatement: incomeProcessed.quarterlyIncomeStatement,
    annualMargins: incomeProcessed.annualMargins,
    quarterlyMargins: incomeProcessed.quarterlyMargins,
    annualCashflowStatement: cashflowProcessed.annualCashflowStatement,
    quarterlyCashflowStatement: cashflowProcessed.quarterlyCashflowStatement,
    annualSharesOutstanding: balanceSheetProcessed.annualSharesOutstanding,
    quarterlySharesOutstanding: balanceSheetProcessed.quarterlySharesOutstanding,
  };
};

// --- Ende stockDataProcessing.ts ---