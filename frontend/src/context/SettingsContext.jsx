import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shopName: 'Projet GB',
    location: '',
    contactPhone: '',
    currency: 'GNF'
  });

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
    console.error("[DEBUG-RELOAD] Nouvelles données reçues:", data.data);
    setSettings(data.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des réglages:", err);
    }
  };

  const uploadLogo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      console.error("[DEBUG-FRONT] Envoi du logo vers:", '/settings/logo', "Fichier:", file.name);
      const { data } = await api.post('/settings/logo', formData);
      if (data.success) {
        fetchSettings();
        return data.data;
      }
    } catch (err) {
      console.error("Erreur lors de l'upload du logo:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings,
    updateSettings: setSettings,
    refreshSettings: fetchSettings,
    uploadLogo
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
