import React, { useState } from 'react';
import { IonInput, IonItem, IonIcon, IonButton } from '@ionic/react';
import { searchOutline, closeOutline } from 'ionicons/icons';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState<string>('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.toUpperCase());
    }
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="search-bar-container">
      <IonItem lines="none" className="search-bar">
        <IonIcon icon={searchOutline} slot="start" className="search-icon" />
        <IonInput
          value={query}
          onIonInput={(e) => setQuery(e.detail.value!)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="Search for a company (e.g., AAPL)"
          className="search-input"
        />
        {query && (
          <IonIcon
            icon={closeOutline}
            slot="end"
            className="clear-icon"
            onClick={clearSearch}
          />
        )}
        <IonButton
          fill="clear" // Entfernt den Button-Hintergrund für ein sauberes Design
          slot="end"
          onClick={handleSearch}
          className="search-button"
        >
          Search
        </IonButton>
      </IonItem>
    </div>
  );
};

export default SearchBar;