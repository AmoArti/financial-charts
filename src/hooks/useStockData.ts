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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<{ [key: string]: any }>({});

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const formatQuarter = (dateString: string): string => {
    const [year, month] = dateString.split('-');
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
  };

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

      if (incomeData['Error Message'] || (!incomeData['annualReports'] && !incomeData['quarterlyReports'])) {
        throw new Error('Ungültiger Ticker oder API-Fehler bei INCOME_STATEMENT');
      }

      // API-Abfrage für EPS (EARNINGS)
      const earningsResponse = await fetch(
        `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`
      );
      const earningsData = await earningsResponse.json();

      if (earningsData['Error Message'] || (!earningsData['annualEarnings'] && !earningsData['quarterlyEarnings'])) {
        throw new Error('Ungültiger Ticker oder API-Fehler bei EARNINGS');
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

      setAnnualData({ labels: last10Years, values: annualRevenue });
      setQuarterlyData({ labels: quarterlyLabels, values: quarterlyRevenue });
      setAnnualEPS({ labels: last10Years, values: annualEPSValues });
      setQuarterlyEPS({ labels: quarterlyEPSLabels, values: quarterlyEPSValues });
      setChartData({ labels: last10Years, values: annualRevenue });

      // Debugging-Ausgaben
      console.log("Annual EPS:", { labels: last10Years, values: annualEPSValues });
      console.log("Quarterly EPS:", { labels: quarterlyEPSLabels, values: quarterlyEPSValues });

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
        },
      }));
    } catch (err) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return { chartData, annualData, quarterlyData, annualEPS, quarterlyEPS, loading, error, fetchData };
};