// src/components/MetricSwitcher.tsx
import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { IonSegmentCustomEvent, SegmentChangeEventDetail } from '@ionic/core';
import './MetricSwitcher.css';

interface MetricOption {
  value: string;
  label: string;
}

interface MetricSwitcherProps {
  options: MetricOption[];
  selectedValue: string;
  onSelectionChange: (value: string) => void;
}

const MetricSwitcher: React.FC<MetricSwitcherProps> = ({ options, selectedValue, onSelectionChange }) => {
  const handleChange = (e: IonSegmentCustomEvent<SegmentChangeEventDetail>) => {
    if (e.detail.value) {
      onSelectionChange(e.detail.value);
    }
  };

  return (
    <IonSegment
      value={selectedValue}
      onIonChange={handleChange}
      mode="md"
      className="metric-switcher-segment"
    >
      {options.map(option => (
        <IonSegmentButton key={option.value} value={option.value}>
          <IonLabel>{option.label}</IonLabel>
        </IonSegmentButton>
      ))}
    </IonSegment>
  );
};

export default MetricSwitcher;