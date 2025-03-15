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
  loading: boolean;
  error: string | null;
  fetchData: (ticker: string) => void;
}

export const useStockData = (): UseStockDataResult => {
  const [chartData, setChartData] = useState<StockData>({ labels: [], values: [] });
  const [annualData, setAnnualData] = useState<StockData>({ labels: [], values: [] });
  const [quarterlyData, setQuarterlyData] = useState<StockData>({ labels: [], values: [] });
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
      setChartData({ labels: cached.annualLabels, values: cached.annualValues });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`
      );
      const data = await response.json();

      if (data['Error Message'] || (!data['annualReports'] && !data['quarterlyReports'])) {
        throw new Error('Ungültiger Ticker oder API-Fehler');
      }

      const currentYear = new Date().getFullYear();
      const last10Years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);

      // Jährliche Daten
      const annualReports = data['annualReports'] || [];
      const annualRevenue = last10Years.map(year => {
        const report = annualReports.find(r => parseInt(r.fiscalDateEnding.split('-')[0]) === year);
        return report ? parseFloat(report.totalRevenue) / 1e9 || 0 : 0;
      });

      // Quartalsweise Daten
      const quarterlyReports = data['quarterlyReports'] || [];
      const quarterlyLabels = quarterlyReports
        .map(report => formatQuarter(report.fiscalDateEnding))
        .slice(0, 12)
        .reverse();
      const quarterlyRevenue = quarterlyReports
        .map(report => parseFloat(report.totalRevenue) / 1e9 || 0)
        .slice(0, 12)
        .reverse();

      setAnnualData({ labels: last10Years, values: annualRevenue });
      setQuarterlyData({ labels: quarterlyLabels, values: quarterlyRevenue });
      setChartData({ labels: last10Years, values: annualRevenue });

      setCachedData(prev => ({
        ...prev,
        [ticker]: {
          annualLabels: last10Years,
          annualValues: annualRevenue,
          quarterlyLabels,
          quarterlyValues: quarterlyRevenue,
        },
      }));
    } catch (err) {
      setError(err.message || 'Fehler beim Abrufen der Daten');
    } finally {
      setLoading(false);
    }
  }, [apiKey, cachedData]);

  return { chartData, annualData, quarterlyData, loading, error, fetchData };
};