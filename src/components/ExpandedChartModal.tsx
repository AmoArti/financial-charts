// src/components/ExpandedChartModal.tsx
import React, { useRef, useState, useMemo } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent
} from '@ionic/react';
import { closeOutline, downloadOutline } from 'ionicons/icons';
import BarChart, { BarChartComponentRef } from './BarChart';
import MetricSwitcher from './MetricSwitcher';
import { MultiDatasetStockData } from '../types/stockDataTypes';
import './ExpandedChartModal.css';

type FcfMetricType = 'fcf' | 'fcfPerShare';

interface ModalConfig {
  title: string;
  yAxisFormat?: 'currency' | 'percent' | 'number' | 'ratio';
  yAxisLabel?: string;
  chartId?: string;
}

interface ExpandedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartId: string | null;
  config: ModalConfig | null;
  dataSources: { [key: string]: MultiDatasetStockData };
}

const ExpandedChartModal: React.FC<ExpandedChartModalProps> = ({
  isOpen,
  onClose,
  chartId,
  config,
  dataSources,
}) => {
  const chartRef = useRef<BarChartComponentRef | undefined>(null);
  const [fcfMetric, setFcfMetric] = useState<FcfMetricType>('fcf');

  const handleExportChart = () => {
    const chartInstance = chartRef.current;
    if (chartInstance && typeof chartInstance.toBase64Image === 'function') {
      const imageBase64 = chartInstance.toBase64Image();
      const link = document.createElement('a');
      link.href = imageBase64;
      const safeTitle = config?.title?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'chart';
      link.download = `${safeTitle}_export.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Chart-Instanz oder toBase64Image-Methode nicht gefunden.", chartInstance);
    }
  };
  
  const { chartData, chartTitle, yAxisFormat, yAxisLabel } = useMemo(() => {
    if (!chartId || !config) return { chartData: null };

    if (chartId === 'fcf') {
      let data, format, label;
      switch (fcfMetric) {
        case 'fcfPerShare':
          data = dataSources.fcfPerShare;
          format = 'number';
          label = 'USD ($)';
          break;
        default:
          data = dataSources.fcf;
          format = 'currency';
          label = 'Billions ($B)';
      }
      return {
        chartData: data,
        chartTitle: config.title,
        yAxisFormat: format as any,
        yAxisLabel: label,
      };
    }

    return {
      chartData: dataSources[chartId],
      chartTitle: config.title,
      yAxisFormat: config.yAxisFormat,
      yAxisLabel: config.yAxisLabel,
    };
  }, [chartId, config, dataSources, fcfMetric]);


  const fcfOptions = [
    { value: 'fcf', label: 'FCF' },
    { value: 'fcfPerShare', label: 'FCF/Share' },
  ];

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="expanded-chart-modal-custom"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{chartTitle || 'Chart Detail'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleExportChart} fill="clear" aria-label="Export Chart">
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
            <IonButton onClick={onClose} fill="clear">
              <IonIcon slot="icon-only" icon={closeOutline} aria-label="Schließen" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* --- NEUER WRAPPER FÜR FLEXBOX-LAYOUT --- */}
        <div className="modal-content-wrapper">
          {/* Zeige den Umschalter nur für den FCF-Chart an */}
          {chartId === 'fcf' && (
             <div className="modal-switcher-container">
                <MetricSwitcher
                  options={fcfOptions}
                  selectedValue={fcfMetric}
                  onSelectionChange={(val) => setFcfMetric(val as FcfMetricType)}
                />
             </div>
          )}

          {chartData && chartData.labels && chartData.labels.length > 0 && chartData.datasets.some(ds => ds.values.length > 0) ? (
            <div className="chart-container-in-modal">
              <BarChart
                ref={chartRef}
                data={chartData}
                title={chartTitle || ''}
                yAxisFormat={yAxisFormat}
                yAxisLabel={yAxisLabel}
              />
            </div>
          ) : (
            <div className="fallback-text-container">
              <p>Keine Daten zum Anzeigen vorhanden oder Chart wird geladen.</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ExpandedChartModal;