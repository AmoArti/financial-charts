// src/services/alphaVantageApi.ts
import { RawApiData } from '../types/stockDataTypes';

const BASE_URL = 'https://www.alphavantage.co/query?';

/**
 * Ruft die notwendigen Endpunkte von Alpha Vantage für einen gegebenen Ticker ab.
 * @param ticker Das Aktiensymbol (z.B. AAPL).
 * @param apiKey Der Alpha Vantage API-Schlüssel.
 * @returns Ein Promise, das die Rohdaten von den APIs als Objekt zurückgibt.
 * @throws Wirft einen Fehler bei Netzwerkproblemen oder wenn der API-Schlüssel fehlt.
 */
export const fetchAlphaVantageData = async (ticker: string, apiKey: string): Promise<RawApiData> => {
  if (!apiKey) {
    throw new Error('API-Schlüssel nicht gefunden. Bitte überprüfen Sie die .env Konfiguration.');
  }
  if (!ticker) {
    throw new Error('Kein Ticker angegeben.');
  }

  // URLs für die API-Endpunkte
  const endpoints = {
    income: `${BASE_URL}function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`,
    earnings: `${BASE_URL}function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`,
    cashflow: `${BASE_URL}function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`,
    overview: `${BASE_URL}function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`,
    quote: `${BASE_URL}function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
    balanceSheet: `${BASE_URL}function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`,
    dividends: `${BASE_URL}function=DIVIDENDS&symbol=${ticker}&apikey=${apiKey}`,
  };

  const keys = Object.keys(endpoints) as (keyof typeof endpoints)[];
  const results: Partial<RawApiData> = {};

  // Funktion zum Abrufen einer einzelnen URL mit Fehlerbehandlung
  const fetchEndpoint = async (key: keyof typeof endpoints, url: string): Promise<any> => {
      try {
          const response = await fetch(url);
          if (!response.ok) {
               // Spezielle Behandlung für 404
              if (response.status === 404) {
                 throw new Error(`Endpoint ${key} nicht gefunden (404)`);
              }
              const text = await response.text();
              throw new Error(`Fehler bei ${key}: ${response.status} ${response.statusText} - ${text}`);
          }
          const data = await response.json();

          // API-Limit Prüfung in der Antwort
          if (data?.Note?.includes('API call frequency') || data?.Information?.includes('API call frequency')) {
             throw new Error('API-Limit erreicht');
          }

          return data;
      } catch (error) {
           console.warn(`Fehler beim Abrufen von ${key}:`, error);
           // Dividenden sind optional, wirf keinen Fehler wenn sie fehlen
           if (key === 'dividends') return null;
           throw error;
      }
  };

  try {
    // Sequenzielles Abrufen um API-Rate-Limits zu schonen (und Parallelitäts-Limits der Free-Tier)
    // Wir machen dies sequenziell, da die Free-Tier oft "concurrent requests" blockiert.
    // Optional könnte man hier auch Batches machen (z.B. 2 gleichzeitig), aber sequenziell ist sicherer.

    // Hinweis: 7 Calls hintereinander dauern etwas, aber verhindern 429 Fehler besser.
    for (const key of keys) {
        results[key] = await fetchEndpoint(key, endpoints[key]);
        // Kleiner Delay zwischen Requests (optional, aber hilfreich)
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Rückgabe der Rohdaten
    return results as RawApiData;

  } catch (error: any) {
    console.error("Fehler beim Abrufen der Alpha Vantage Daten:", error);
    if (error.message.includes('API-Limit erreicht')) {
         throw new Error('API-Limit erreicht. Bitte warten Sie eine Minute.');
    }
    throw new Error(`Fehler beim Laden der Daten: ${error.message}`);
  }
};
