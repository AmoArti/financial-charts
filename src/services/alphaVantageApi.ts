// src/services/alphaVantageApi.ts
import { RawApiData } from '../types/stockDataTypes'; // RawApiData muss ggf. erweitert werden

const BASE_URL = 'https://www.alphavantage.co/query?';

/**
 * Ruft die notwendigen Endpunkte von Alpha Vantage für einen gegebenen Ticker ab.
 * NEU: Inklusive BALANCE_SHEET.
 * @param ticker Das Aktiensymbol (z.B. AAPL).
 * @param apiKey Der Alpha Vantage API-Schlüssel.
 * @returns Ein Promise, das die Rohdaten von den APIs als Objekt zurückgibt.
 * @throws Wirft einen Fehler bei Netzwerkproblemen oder wenn der API-Schlüssel fehlt.
 */
export const fetchAlphaVantageData = async (ticker: string, apiKey: string): Promise<RawApiData> => {
  if (!apiKey) {
    throw new Error('API-Schlüssel nicht gefunden...');
  }
  if (!ticker) {
    throw new Error('Kein Ticker angegeben.');
  }

  // URLs für die API-Endpunkte (inkl. Balance Sheet)
  const urls = {
    income: `${BASE_URL}function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`,
    earnings: `${BASE_URL}function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`,
    cashflow: `${BASE_URL}function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`,
    overview: `${BASE_URL}function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`,
    quote: `${BASE_URL}function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
    balanceSheet: `${BASE_URL}function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`, // NEU
  };

  try {
    // Parallele Abfragen starten (inkl. Balance Sheet)
    const [
        incomeResponse,
        earningsResponse,
        cashFlowResponse,
        overviewResponse,
        quoteResponse,
        balanceSheetResponse // NEU
    ] = await Promise.all([
      fetch(urls.income),
      fetch(urls.earnings),
      fetch(urls.cashflow),
      fetch(urls.overview),
      fetch(urls.quote),
      fetch(urls.balanceSheet), // NEU
    ]);

    // Prüfen, ob alle Antworten erfolgreich waren (Status 2xx)
    const responses = [
        incomeResponse,
        earningsResponse,
        cashFlowResponse,
        overviewResponse,
        quoteResponse,
        balanceSheetResponse // NEU
    ];
    for (const response of responses) {
      if (!response.ok) {
        // Versuche, die Fehlermeldung aus der API-Antwort zu lesen
        let apiError = `API-Fehler bei ${response.url} (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          // Alpha Vantage spezifische Fehlermeldungen könnten hier extrahiert werden
          if (errorData?.Information) apiError += `: ${errorData.Information}`;
          else if (errorData?.Note) apiError += `: ${errorData.Note}`; // Limit erreicht?
          else if (errorData?.['Error Message']) apiError += `: ${errorData['Error Message']}`;
        } catch (e) { /* Ignoriere JSON-Parse-Fehler bei der Fehlermeldung */ }
        // Spezifische Fehler werfen, die im Hook gefangen werden können
        if (response.status === 404) throw new Error(`Ticker ${ticker} nicht gefunden (Status 404)`);
        if (apiError.includes('API call frequency') || apiError.includes('higher API call frequency')) throw new Error('API-Limit erreicht'); // Prüfe auf beide Varianten
        throw new Error(apiError);
      }
    }

    // JSON-Daten aus den Antworten extrahieren (inkl. Balance Sheet)
    const [
        incomeData,
        earningsData,
        cashFlowData,
        overviewData,
        quoteData,
        balanceSheetData // NEU
    ] = await Promise.all([
      incomeResponse.json(),
      earningsResponse.json(),
      cashFlowResponse.json(),
      overviewResponse.json(),
      quoteResponse.json(),
      balanceSheetResponse.json(), // NEU
    ]);

    // Hinweis auf API-Limit/Info im Erfolgsfall (manchmal als 'Note' oder 'Information' enthalten)
    const notesOrInfo = [
        overviewData?.Note, incomeData?.Note, earningsData?.Note, cashFlowData?.Note, quoteData?.Note, balanceSheetData?.Note, // NEU
        overviewData?.Information, incomeData?.Information, earningsData?.Information, cashFlowData?.Information, quoteData?.Information, balanceSheetData?.Information // NEU
    ].filter(Boolean); // Entferne undefined/null Einträge

    if (notesOrInfo.length > 0) {
        console.warn("Alpha Vantage API Note/Information:", notesOrInfo.join(' | '));
        // Prüfe explizit auf Limit-Nachricht, auch wenn der Call erfolgreich war
        if (notesOrInfo.some(note => note.includes('API call frequency') || note.includes('higher API call frequency'))) {
            // Optional: Fehler werfen oder nur warnen? Vorerst nur Warnung.
            console.warn("Mögliches API-Limit trotz erfolgreicher Antwort erkannt.");
            // throw new Error('API-Limit erreicht'); // Bei Bedarf aktivieren
        }
    }

    // Rückgabe der Rohdaten (inkl. Balance Sheet)
    return {
      income: incomeData,
      earnings: earningsData,
      cashflow: cashFlowData,
      overview: overviewData,
      quote: quoteData,
      balanceSheet: balanceSheetData, // NEU
    };

  } catch (error) {
    // Fehler weiterwerfen, damit der Hook ihn fangen kann
    console.error("Fehler beim Abrufen der Alpha Vantage Daten:", error);
    if (error instanceof Error) {
        // Gib spezifische Fehler weiter
        throw error;
    }
    throw new Error('Netzwerkfehler oder unbekannter Fehler beim API-Abruf.');
  }
};

// --- Ende alphaVantageApi.ts ---