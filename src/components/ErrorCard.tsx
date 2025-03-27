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
    <IonCard className="error-card" style={{ margin: '20px 0', border: '1px solid #ff4d4f' }}>
      <IonCardHeader>
        <IonCardTitle style={{ color: '#ff4d4f' }}>Fehler</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p><strong>Fehlermeldung:</strong> {error}</p>
        <p><strong>Erklärung:</strong> {getErrorDetails(error).explanation}</p>
        <p><strong>Empfehlung:</strong> {getErrorDetails(error).recommendation}</p>
        <IonButton
          fill="outline"
          color="danger"
          onClick={onRetry}
          style={{ marginTop: '10px' }}
        >
          <IonIcon icon={refreshOutline} slot="start" />
          Erneut versuchen
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default ErrorCard;