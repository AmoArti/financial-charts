// src/hooks/useStockData.ts
import { useState, useCallback } from 'react';

interface StockData {
  labels: (string | number)[];
  values: number[];
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
  fetchData: (ticker: string) => void;
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
  const [cachedData, setCachedData] = useState<{ [key: string]: any }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const formatQuarter = (dateString: string): string => {
    const [year, month] = dateString.split('-');
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
  };

  // Hilfsfunktion für Verzögerung (um API-Limit zu umgehen)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchData = useCallback(async (ticker: string) => {
    if (!apiKey) {
      setError('API-Schlüssel nicht gefunden. Bitte überprüfe die .env-Datei.');
      return;
    }

    if (cachedData[ticker]) {
      console.log(`Using cached data for ${ticker}`);
      const cached = cachedData[ticker];
      setAnnualData({ labels: cached.annualLabels, values: cached.annualValues });
      setQuarterlyData({ labels: cached.quarterlyLabels, values: cached.quarterlyValues });
      setAnnualEPS({ labels: cached.annualEPSLabels, values: cached.annualEPSValues });
      setQuarterlyEPS({ labels: cached.quarterlyEPSLabels, values: cached.quarterlyEPSValues });
      setAnnualFCF({ labels: cached.annualFCFLabels, values: cached.annualFCFValues });
      setQuarterlyFCF({ labels: cached.quarterlyFCFLabels, values: cached.quarterlyFCFValues });
      setChartData({ labels: cached.annualLabels, values: cached.annualValues });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // API-Abfrage für Umsatz (INCOME_STATEMENT)
      const incomeResponse = await fetch(
        `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`
      );
      const incomeData = await incomeResponse.json();

      if (incomeData['Error Message']) {
        throw new Error(`API-Fehler bei INCOME_STATEMENT: ${incomeData['Error Message']}`);
      }
      if (incomeData['Note']) {
        throw new Error(`API-Limit erreicht: ${incomeData['Note']}`);
      }
      if (!incomeData['annualReports'] && !incomeData['quarterlyReports']) {
        throw new Error('Keine Umsatzdaten für diesen Ticker verfügbar.');
      }

      // Verzögerung vor dem nächsten Aufruf (um API-Limit zu umgehen)
      await delay(15000); // 15 Sekunden Verzögerung

      // API-Abfrage für EPS (EARNINGS)
      const earningsResponse = await fetch(
        `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`
      );
      const earningsData = await earningsResponse.json();

      if (earningsData['Error Message']) {
        throw new Error(`API-Fehler bei EARNINGS: ${earningsData['Error Message']}`);
      }
      if (earningsData['Note']) {
        throw new Error(`API-Limit erreicht: ${earningsData['Note']}`);
      }
      if (!earningsData['annualEarnings'] && !earningsData['quarterlyEarnings']) {
        throw new Error('Keine EPS-Daten für diesen Ticker verfügbar.');
      }

      // Verzögerung vor dem nächsten Aufruf
      await delay(15000); // 15 Sekunden Verzögerung

      // API-Abfrage für Cash Flow (CASH_FLOW)
      const cashFlowResponse = await fetch(
        `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`
      );
      const cashFlowData = await cashFlowResponse.json();

      if (cashFlowData['Error Message']) {
        throw new Error(`API-Fehler bei CASH_FLOW: ${cashFlowData['Error Message']}`);
      }
      if (cashFlowData['Note']) {
        throw new Error(`API-Limit erreicht: ${cashFlowData['Note']}`);
      }
      if (!cashFlowData['annualReports'] && !cashFlowData['quarterlyReports']) {
        throw new Error('Keine Cashflow-Daten für diesen Ticker verfügbar.');
      }

      const currentYear = new Date().getFullYear();
      const last10Years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);

      // Jährliche Umsatzdaten
      const annualReports = incomeData['annualReports'] || [];
      const annualRevenue = last10Years.map(year => {
        const report = annualReports.find(r => parseInt(r.fiscalDateEnding.split('-')[0]) === year);
        return report ? parseFloat(report.totalRevenue) / 1e9 || 0 : 0;
      });

      // Quartalsweise Umsatzdaten
      const quarterlyReports = incomeData['quarterlyReports'] || [];
      const quarterlyLabels = quarterlyReports
        .map(report => formatQuarter(report.fiscalDateEnding))
        .slice(0, 12)
        .reverse();
      const quarterlyRevenue = quarterlyReports
        .map(report => parseFloat(report.totalRevenue) / 1e9 || 0)
        .slice(0, 12)
        .reverse();

      // Jährliche EPS-Daten
      const annualEarnings = earningsData['annualEarnings'] || [];
      const annualEPSValues = last10Years.map(year => {
        const earning = annualEarnings.find(e => parseInt(e.fiscalDateEnding.split('-')[0]) === year);
        return earning ? parseFloat(earning.reportedEPS) || 0 : 0;
      });

      // Quartalsweise EPS-Daten
      const quarterlyEarnings = earningsData['quarterlyEarnings'] || [];
      const quarterlyEPSLabels = quarterlyEarnings
        .map(earning => formatQuarter(earning.fiscalDateEnding))
        .slice(0, 12)
        .reverse();
      const quarterlyEPSValues = quarterlyEarnings
        .map(earning => parseFloat(earning.reportedEPS) || 0)
        .slice(0, 12)
        .reverse();

      // Jährliche Free Cash Flow-Daten
      const annualCashFlowReports = cashFlowData['annualReports'] || [];
      const annualFCFValues = last10Years.map(year => {
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
      const quarterlyFCFLabels = quarterlyCashFlowReports
        .map(report => formatQuarter(report.fiscalDateEnding))
        .slice(0, 12)
        .reverse();
      const quarterlyFCFValues = quarterlyCashFlowReports
        .map(report => {
          const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
          const capitalExpenditures = parseFloat(report.capitalExpenditures) || 0;
          return (operatingCashflow - Math.abs(capitalExpenditures)) / 1e9; // In Milliarden $
        })
        .slice(0, 12)
        .reverse();

      setAnnualData({ labels: last10Years, values: annualRevenue });
      setQuarterlyData({ labels: quarterlyLabels, values: quarterlyRevenue });
      setAnnualEPS({ labels: last10Years, values: annualEPSValues });
      setQuarterlyEPS({ labels: quarterlyEPSLabels, values: quarterlyEPSValues });
      setAnnualFCF({ labels: last10Years, values: annualFCFValues });
      setQuarterlyFCF({ labels: quarterlyFCFLabels, values: quarterlyFCFValues });
      setChartData({ labels: last10Years, values: annualRevenue });

      // Debugging-Ausgaben
      console.log("Annual Revenue:", { labels: last10Years, values: annualRevenue });
      console.log("Quarterly Revenue:", { labels: quarterlyLabels, values: quarterlyRevenue });
      console.log("Annual EPS:", { labels: last10Years, values: annualEPSValues });
      console.log("Quarterly EPS:", { labels: quarterlyEPSLabels, values: quarterlyEPSValues });
      console.log("Annual FCF:", { labels: last10Years, values: annualFCFValues });
      console.log("Quarterly FCF:", { labels: quarterlyFCFLabels, values: quarterlyFCFValues });

      setCachedData(prev => ({
        ...prev,
        [ticker]: {
          annualLabels: last10Years,
          annualValues: annualRevenue,
          quarterlyLabels,
          quarterlyValues: quarterlyRevenue,
          annualEPSLabels: last10Years,
          annualEPSValues,
          quarterlyEPSLabels,
          quarterlyEPSValues,
          annualFCFLabels: last10Years,
          annualFCFValues,
          quarterlyFCFLabels,
          quarterlyFCFValues,
        },
      }));
    } catch (err) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, annualFCF, quarterlyFCF, loading, error, fetchData };
};