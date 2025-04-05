// src/components/LoadingIndicator.tsx
import React from 'react';
import { IonSpinner, IonProgressBar } from '@ionic/react';

interface LoadingIndicatorProps {
  progress: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ progress }) => {
  return (
    <div className="loading-indicator-wrapper">
      <IonSpinner name="crescent" />
      <p>Lädt Daten... ({Math.round(progress)}%)</p>
      <IonProgressBar
        value={progress / 100}
        buffer={1}
      />
    </div>
  );
};

export default LoadingIndicator;