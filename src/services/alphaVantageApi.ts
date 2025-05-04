// src/services/alphaVantageApi.ts (Erweitert um DIVIDENDS Endpunkt)
import { RawApiData } from '../types/stockDataTypes'; // RawApiData muss 'dividends' enthalten

const BASE_URL = 'https://www.alphavantage.co/query?';

/**
 * Ruft die notwendigen Endpunkte von Alpha Vantage für einen gegebenen Ticker ab.
 * NEU: Inklusive BALANCE_SHEET und DIVIDENDS.
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

  // URLs für die API-Endpunkte (inkl. Balance Sheet und Dividends)
  const urls = {
    income: `${BASE_URL}function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`,
    earnings: `${BASE_URL}function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`,
    cashflow: `${BASE_URL}function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`,
    overview: `${BASE_URL}function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`,
    quote: `${BASE_URL}function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
    balanceSheet: `${BASE_URL}function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`,
    dividends: `${BASE_URL}function=DIVIDENDS&symbol=${ticker}&apikey=${apiKey}`, // NEU
  };

  try {
    // Parallele Abfragen starten (inkl. Dividends)
    const [
        incomeResponse,
        earningsResponse,
        cashFlowResponse,
        overviewResponse,
        quoteResponse,
        balanceSheetResponse,
        dividendsResponse // NEU
    ] = await Promise.all([
      fetch(urls.income),
      fetch(urls.earnings),
      fetch(urls.cashflow),
      fetch(urls.overview),
      fetch(urls.quote),
      fetch(urls.balanceSheet),
      fetch(urls.dividends), // NEU
    ]);

    // Prüfen, ob alle Antworten erfolgreich waren (Status 2xx)
    const responses = [
        incomeResponse,
        earningsResponse,
        cashFlowResponse,
        overviewResponse,
        quoteResponse,
        balanceSheetResponse,
        dividendsResponse // NEU
    ];
    for (const response of responses) {
      if (!response.ok) {
        // Versuche, die Fehlermeldung aus der API-Antwort zu lesen
        let apiError = `API-Fehler bei ${response.url} (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData?.Information) apiError += `: ${errorData.Information}`;
          else if (errorData?.Note) apiError += `: ${errorData.Note}`;
          else if (errorData?.['Error Message']) apiError += `: ${errorData['Error Message']}`;
        } catch (e) { /* Ignoriere JSON-Parse-Fehler bei der Fehlermeldung */ }

        // Spezifische Fehler werfen
        if (response.status === 404) throw new Error(`Ticker ${ticker} oder Daten nicht gefunden (Status 404 bei ${response.url})`);
        if (apiError.includes('API call frequency') || apiError.includes('higher API call frequency')) throw new Error('API-Limit erreicht');
        // Prüfe auf speziellen Fehler bei DIVIDENDS, falls nur dieser Endpunkt manchmal fehlschlägt
        if (response.url.includes('function=DIVIDENDS') && response.status !== 200) {
             console.warn(`Warnung: Abruf für DIVIDENDS fehlgeschlagen (Status ${response.status}), fahre mit anderen Daten fort.`);
             // Wir werfen hier *keinen* harten Fehler, damit der Rest funktioniert
             // Die Verarbeitung muss später mit fehlenden Dividenden umgehen können
        } else {
             throw new Error(apiError); // Harter Fehler für andere Endpunkte
        }
      }
    }

    // JSON-Daten aus den Antworten extrahieren (inkl. Dividends)
    // Beachte: dividendsResponse.json() könnte fehlschlagen, wenn der Call oben schon nicht ok war,
    // aber wir lassen Promise.all es versuchen und fangen den Fehler ggf. im Haupt-catch.
    // Sicherer wäre, nur .json() für response.ok === true aufzurufen.
    // Einfacher Ansatz: Annahme, dass .json() für den Dividenden-Fehlerfall ein leeres Objekt oder Ähnliches liefert oder im catch landet.
    const [
        incomeData,
        earningsData,
        cashFlowData,
        overviewData,
        quoteData,
        balanceSheetData,
        dividendsData // NEU
    ] = await Promise.all(responses.map(res => {
        // Prüfe, ob der Response OK war, bevor json() aufgerufen wird,
        // gib null zurück bei Fehlern (speziell für Dividenden)
        if (!res.ok && res.url.includes('function=DIVIDENDS')) {
            return Promise.resolve(null); // Gib null zurück, wenn Dividenden-Call fehlgeschlagen ist
        }
         if (!res.ok) {
            // Für andere Fehler werfen wir hier implizit einen Fehler, da der Loop oben das schon getan hätte
            // oder wir behandeln es expliziter, falls der Loop oben geändert wird.
            // Sicherste Variante wäre, hier bei !res.ok einen Fehler zu werfen oder null zurückzugeben.
             return Promise.resolve(null); // Gib null zurück für andere fehlerhafte Antworten
        }
        // Nur wenn ok, parse JSON
        return res.json();
    }));


    // Hinweis auf API-Limit/Info im Erfolgsfall
    const notesOrInfo = [
        overviewData?.Note, incomeData?.Note, earningsData?.Note, cashFlowData?.Note, quoteData?.Note, balanceSheetData?.Note, dividendsData?.Note, // NEU
        overviewData?.Information, incomeData?.Information, earningsData?.Information, cashFlowData?.Information, quoteData?.Information, balanceSheetData?.Information, dividendsData?.Information // NEU
    ].filter(Boolean);

    if (notesOrInfo.length > 0) {
        console.warn("Alpha Vantage API Note/Information:", notesOrInfo.join(' | '));
        if (notesOrInfo.some(note => note.includes('API call frequency') || note.includes('higher API call frequency'))) {
            console.warn("Mögliches API-Limit trotz erfolgreicher Antwort erkannt.");
            // Optional: throw new Error('API-Limit erreicht');
        }
    }

    // Rückgabe der Rohdaten (inkl. Dividends)
    return {
      income: incomeData,
      earnings: earningsData,
      cashflow: cashFlowData,
      overview: overviewData,
      quote: quoteData,
      balanceSheet: balanceSheetData,
      dividends: dividendsData, // NEU
    };

  } catch (error) {
    // Fehler weiterwerfen, damit der Hook ihn fangen kann
    console.error("Fehler beim Abrufen der Alpha Vantage Daten:", error);
    if (error instanceof Error) {
        throw error; // Gib spezifische Fehler weiter
    }
    throw new Error('Netzwerkfehler oder unbekannter Fehler beim API-Abruf.');
  }
};

// --- Ende alphaVantageApi.ts ---