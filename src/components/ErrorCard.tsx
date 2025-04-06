// src/components/ErrorCard.tsx
import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';

interface ErrorCardProps {
  error: string;
  getErrorDetails: (errorMessage: string) => { explanation: string; recommendation: string };
  onRetry: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, getErrorDetails, onRetry }) => {
  return (
    // Inline-Styles für margin und border entfernt
    <IonCard className="error-card">
      <IonCardHeader>
        {/* Inline-Style für color entfernt */}
        <IonCardTitle>Fehler</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p><strong>Fehlermeldung:</strong> {error}</p>
        <p><strong>Erklärung:</strong> {getErrorDetails(error).explanation}</p>
        <p><strong>Empfehlung:</strong> {getErrorDetails(error).recommendation}</p>
        <IonButton
          fill="outline"
          color="danger"
          onClick={onRetry}
          // Inline-Style für marginTop entfernt (wird über CSS gesteuert)
        >
          <IonIcon icon={refreshOutline} slot="start" />
          Erneut versuchen
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default ErrorCard;