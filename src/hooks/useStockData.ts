// src/hooks/useStockData.ts
import { useState, useCallback } from 'react';
import { formatQuarter } from '../utils/utils'; // Import von formatQuarter

interface StockData {
  labels: (string | number)[];
  values: number[];
}

interface CompanyInfo {
  Name: string;
  Industry: string;
  Address: string;
  MarketCapitalization: string;
  LastSale: string;
}

interface UseStockDataResult {
  chartData: StockData;
  annualData: StockData;
  quarterlyData: StockData;
  annualEPS: StockData;
  quarterlyEPS: StockData;
  annualFCF: StockData;
  quarterlyFCF: StockData;
  loading: boolean;
  error: string | null;
  progress: number;
  companyInfo: CompanyInfo | null;
  fetchData: (ticker: string, years: number) => void;
}

export const useStockData = (): UseStockDataResult => {
  const [chartData, setChartData] = useState<StockData>({ labels: [], values: [] });
  const [annualData, setAnnualData] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyData, setQuarterlyData] = useState<StockData>({ labels: [], values: [] });
  const [annualEPS, setAnnualEPS] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyEPS, setQuarterlyEPS] = useState<StockData>({ labels: [], values: [] });
  const [annualFCF, setAnnualFCF] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyFCF, setQuarterlyFCF] = useState<StockData>({ labels: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [cachedData, setCachedData] = useState<{ [key: string]: any }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const fetchData = useCallback(async (ticker: string, years: number) => {
    if (!apiKey) {
      setError('API-Schlüssel nicht gefunden. Bitte überprüfe die .env-Datei.');
      return;
    }

    const cacheKey = `${ticker}-${years}`; // Cache-Schlüssel basierend auf Ticker und Zeitspanne
    if (cachedData[cacheKey]) {
      console.log(`Using cached data for ${ticker} (${years} years)`);
      const cached = cachedData[cacheKey];
      setAnnualData({ labels: cached.annualLabels, values: cached.annualValues });
      setQuarterlyData({ labels: cached.quarterlyLabels, values: cached.quarterlyValues });
      setAnnualEPS({ labels: cached.annualEPSLabels, values: cached.annualEPSValues });
      setQuarterlyEPS({ labels: cached.quarterlyEPSLabels, values: cached.quarterlyEPSValues });
      setAnnualFCF({ labels: cached.annualFCFLabels, values: cached.annualFCFValues });
      setQuarterlyFCF({ labels: cached.quarterlyFCFLabels, values: cached.quarterlyFCFValues });
      setChartData({ labels: cached.annualLabels, values: cached.annualValues });
      setCompanyInfo(cached.companyInfo);
      setProgress(100);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setCompanyInfo(null);

    try {
      // Fortschritt simulieren: Start bei 10%
      setProgress(10);

      // Parallele API-Aufrufe für Finanzdaten, Unternehmensinformationen und aktuellen Aktienkurs
      const [incomeResponse, earningsResponse, cashFlowResponse, overviewResponse, quoteResponse] = await Promise.all([
        fetch(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`),
      ]);

      // Fortschritt nach Absenden der Anfragen: 50%
      setProgress(50);

      const [incomeData, earningsData, cashFlowData, overviewData, quoteData] = await Promise.all([
        incomeResponse.json(),
        earningsResponse.json(),
        cashFlowResponse.json(),
        overviewResponse.json(),
        quoteResponse.json(),
      ]);

      // Fortschritt nach Empfang der Antworten: 90%
      setProgress(90);

      // Fehlerprüfung für Finanzdaten
      if (incomeData['Error Message']) {
        throw new Error(`API-Fehler bei INCOME_STATEMENT: ${incomeData['Error Message']}`);
      }
      if (incomeData['Note']) {
        throw new Error(`API-Limit erreicht: INCOME_STATEMENT – ${incomeData['Note']}`);
      }
      if (!incomeData['annualReports'] && !incomeData['quarterlyReports']) {
        throw new Error('Keine Umsatzdaten für diesen Ticker verfügbar.');
      }

      if (earningsData['Error Message']) {
        throw new Error(`API-Fehler bei EARNINGS: ${earningsData['Error Message']}`);
      }
      if (earningsData['Note']) {
        throw new Error(`API-Limit erreicht: EARNINGS – ${earningsData['Note']}`);
      }
      if (!earningsData['annualEarnings'] && !earningsData['quarterlyEarnings']) {
        throw new Error('Keine EPS-Daten für diesen Ticker verfügbar.');
      }

      if (cashFlowData['Error Message']) {
        throw new Error(`API-Fehler bei CASH_FLOW: ${cashFlowData['Error Message']}`);
      }
      if (cashFlowData['Note']) {
        throw new Error(`API-Limit erreicht: CASH_FLOW – ${cashFlowData['Note']}`);
      }
      if (!cashFlowData['annualReports'] && !cashFlowData['quarterlyReports']) {
        throw new Error('Keine Cashflow-Daten für diesen Ticker verfügbar.');
      }

      // Fehlerprüfung für Unternehmensinformationen
      if (overviewData['Error Message']) {
        throw new Error(`API-Fehler bei OVERVIEW: ${overviewData['Error Message']}`);
      }
      if (overviewData['Note']) {
        throw new Error(`API-Limit erreicht: OVERVIEW – ${overviewData['Note']}`);
      }
      if (!overviewData['Name']) {
        throw new Error('Keine Unternehmensinformationen für diesen Ticker verfügbar.');
      }

      // Fehlerprüfung für Aktienkurs
      if (quoteData['Error Message']) {
        throw new Error(`API-Fehler bei GLOBAL_QUOTE: ${quoteData['Error Message']}`);
      }
      if (quoteData['Note']) {
        throw new Error(`API-Limit erreicht: GLOBAL_QUOTE – ${quoteData['Note']}`);
      }
      if (!quoteData['Global Quote'] || !quoteData['Global Quote']['05. price']) {
        throw new Error('Kein aktueller Aktienkurs für diesen Ticker verfügbar.');
      }

      // Unternehmensinformationen speichern, inklusive aktuellem Aktienkurs
      setCompanyInfo({
        Name: overviewData['Name'],
        Industry: overviewData['Industry'],
        Address: overviewData['Address'],
        MarketCapitalization: overviewData['MarketCapitalization'],
        LastSale: parseFloat(quoteData['Global Quote']['05. price']).toFixed(2),
      });

      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1; // Startjahr basierend auf der gewünschten Zeitspanne
      const availableYears = Array.from({ length: years }, (_, i) => startYear + i);

      // Jährliche Umsatzdaten
      const annualReports = incomeData['annualReports'] || [];
      const annualRevenue = availableYears.map(year => {
        const report = annualReports.find(r => parseInt(r.fiscalDateEnding.split('-')[0]) === year);
        return report ? parseFloat(report.totalRevenue) / 1e9 || 0 : 0;
      });

      // Quartalsweise Umsatzdaten
      const quarterlyReports = incomeData['quarterlyReports'] || [];
      const numQuarters = years * 4; // Anzahl der Quartale basierend auf der Zeitspanne (z. B. 10 Jahre = 40 Quartale)
      const startDate = new Date(`${startYear}-01-01`); // Startdatum für die gewünschte Zeitspanne

      // Filtern der quartalsweisen Daten basierend auf dem Startdatum
      const filteredQuarterlyReports = quarterlyReports.filter(report => {
        const reportDate = new Date(report.fiscalDateEnding);
        return reportDate >= startDate;
      });

      const quarterlyLabels = filteredQuarterlyReports
        .map(report => formatQuarter(report.fiscalDateEnding))
        .slice(0, numQuarters) // Begrenze auf die gewünschte Anzahl von Quartalen
        .reverse();
      const quarterlyRevenue = filteredQuarterlyReports
        .map(report => parseFloat(report.totalRevenue) / 1e9 || 0)
        .slice(0, numQuarters) // Begrenze auf die gewünschte Anzahl von Quartalen
        .reverse();

      // Jährliche EPS-Daten
      const annualEarnings = earningsData['annualEarnings'] || [];
      const annualEPSValues = availableYears.map(year => {
        const earning = annualEarnings.find(e => parseInt(e.fiscalDateEnding.split('-')[0]) === year);
        return earning ? parseFloat(earning.reportedEPS) || 0 : 0;
      });

      // Quartalsweise EPS-Daten
      const quarterlyEarnings = earningsData['quarterlyEarnings'] || [];
      const filteredQuarterlyEarnings = quarterlyEarnings.filter(earning => {
        const earningDate = new Date(earning.fiscalDateEnding);
        return earningDate >= startDate;
      });

      const quarterlyEPSLabels = filteredQuarterlyEarnings
        .map(earning => formatQuarter(earning.fiscalDateEnding))
        .slice(0, numQuarters) // Begrenze auf die gewünschte Anzahl von Quartalen
        .reverse();
      const quarterlyEPSValues = filteredQuarterlyEarnings
        .map(earning => parseFloat(earning.reportedEPS) || 0)
        .slice(0, numQuarters) // Begrenze auf die gewünschte Anzahl von Quartalen
        .reverse();

      // Jährliche Free Cash Flow-Daten
      const annualCashFlowReports = cashFlowData['annualReports'] || [];
      const annualFCFValues = availableYears.map(year => {
        const report = annualCashFlowReports.find(r => parseInt(r.fiscalDateEnding.split('-')[0]) === year);
        if (report) {
          const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
          const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
          return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // In Milliarden $
        }
        return 0;
      });

      // Quartalsweise Free Cash Flow-Daten
      const quarterlyCashFlowReports = cashFlowData['quarterlyReports'] || [];
      const filteredQuarterlyCashFlowReports = quarterlyCashFlowReports.filter(report => {
        const reportDate = new Date(report.fiscalDateEnding);
        return reportDate >= startDate;
      });

      const quarterlyFCFLabels = filteredQuarterlyCashFlowReports
        .map(report => formatQuarter(report.fiscalDateEnding))
        .slice(0, numQuarters) // Begrenze auf die gewünschte Anzahl von Quartalen
        .reverse();
      const quarterlyFCFValues = filteredQuarterlyCashFlowReports
        .map(report => {
          const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
          const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
          return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // In Milliarden $
        })
        .slice(0, numQuarters) // Begrenze auf die gewünschte Anzahl von Quartalen
        .reverse();

      // Edge Case: Wenn weniger Daten verfügbar sind, schneiden wir die Jahre entsprechend ab
      const trimData = (labels: (string | number)[], values: number[]) => {
        const firstNonZeroIndex = values.findIndex(value => value !== 0);
        if (firstNonZeroIndex === -1) {
          return { labels: [], values: [] }; // Keine Daten verfügbar
        }
        return {
          labels: labels.slice(firstNonZeroIndex),
          values: values.slice(firstNonZeroIndex),
        };
      };

      const trimmedAnnualRevenue = trimData(availableYears, annualRevenue);
      const trimmedAnnualEPS = trimData(availableYears, annualEPSValues);
      const trimmedAnnualFCF = trimData(availableYears, annualFCFValues);
      const trimmedQuarterlyRevenue = trimData(quarterlyLabels, quarterlyRevenue);
      const trimmedQuarterlyEPS = trimData(quarterlyEPSLabels, quarterlyEPSValues);
      const trimmedQuarterlyFCF = trimData(quarterlyFCFLabels, quarterlyFCFValues);

      setAnnualData({ labels: trimmedAnnualRevenue.labels, values: trimmedAnnualRevenue.values });
      setQuarterlyData({ labels: trimmedQuarterlyRevenue.labels, values: trimmedQuarterlyRevenue.values });
      setAnnualEPS({ labels: trimmedAnnualEPS.labels, values: trimmedAnnualEPS.values });
      setQuarterlyEPS({ labels: trimmedQuarterlyEPS.labels, values: trimmedQuarterlyEPS.values });
      setAnnualFCF({ labels: trimmedAnnualFCF.labels, values: trimmedAnnualFCF.values });
      setQuarterlyFCF({ labels: trimmedQuarterlyFCF.labels, values: trimmedQuarterlyFCF.values });
      setChartData({ labels: trimmedAnnualRevenue.labels, values: trimmedAnnualRevenue.values });

      // Fortschritt auf 100% setzen, da Daten erfolgreich geladen wurden
      setProgress(100);

      // Debugging-Ausgaben
      console.log("Annual Revenue:", { labels: trimmedAnnualRevenue.labels, values: trimmedAnnualRevenue.values });
      console.log("Quarterly Revenue:", { labels: trimmedQuarterlyRevenue.labels, values: trimmedQuarterlyRevenue.values });
      console.log("Annual EPS:", { labels: trimmedAnnualEPS.labels, values: trimmedAnnualEPS.values });
      console.log("Quarterly EPS:", { labels: trimmedQuarterlyEPS.labels, values: trimmedQuarterlyEPS.values });
      console.log("Annual FCF:", { labels: trimmedAnnualFCF.labels, values: trimmedAnnualFCF.values });
      console.log("Quarterly FCF:", { labels: trimmedQuarterlyFCF.labels, values: trimmedQuarterlyFCF.values });
      console.log("Company Info:", {
        Name: overviewData['Name'],
        Industry: overviewData['Industry'],
        Address: overviewData['Address'],
        MarketCapitalization: overviewData['MarketCapitalization'],
        LastSale: quoteData['Global Quote']['05. price'],
      });

      setCachedData(prev => ({
        ...prev,
        [cacheKey]: {
          annualLabels: trimmedAnnualRevenue.labels,
          annualValues: trimmedAnnualRevenue.values,
          quarterlyLabels: trimmedQuarterlyRevenue.labels,
          quarterlyValues: trimmedQuarterlyRevenue.values,
          annualEPSLabels: trimmedAnnualEPS.labels,
          annualEPSValues: trimmedAnnualEPS.values,
          quarterlyEPSLabels: trimmedQuarterlyEPS.labels,
          quarterlyEPSValues: trimmedQuarterlyEPS.values,
          annualFCFLabels: trimmedAnnualFCF.labels,
          annualFCFValues: trimmedAnnualFCF.values,
          quarterlyFCFLabels: trimmedQuarterlyFCF.labels,
          quarterlyFCFValues: trimmedQuarterlyFCF.values,
          companyInfo: {
            Name: overviewData['Name'],
            Industry: overviewData['Industry'],
            Address: overviewData['Address'],
            MarketCapitalization: overviewData['MarketCapitalization'],
            LastSale: parseFloat(quoteData['Global Quote']['05. price']).toFixed(2),
          },
        },
      }));
    } catch (err) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, progress, companyInfo, fetchData };
};