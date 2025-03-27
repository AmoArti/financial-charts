// src/components/LoadingIndicator.tsx
import React from 'react';
import { IonSpinner, IonProgressBar } from '@ionic/react';

interface LoadingIndicatorProps {
  progress: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ progress }) => {
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <IonSpinner name="crescent" />
      <p>Lädt Daten... ({Math.round(progress)}%)</p>
      <IonProgressBar value={progress / 100} buffer={1} className="loading-container" style={{ marginTop: '10px' }} />
    </div>
  );
};

export default LoadingIndicator;