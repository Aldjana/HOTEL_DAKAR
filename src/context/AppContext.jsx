import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsApi } from '../services/api/settingsApi';
import { useAuth } from './AuthContext';
import { tr } from '../i18n';

const AppContext = createContext(null);

// Paramètres de l'établissement (nom, logo, devise, horaires) chargés depuis l'API, partagés dans toute l'application.
export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);

  const refreshSettings = useCallback(async () => {
    try { setSettings(await settingsApi.getHotel()); } catch { /* non bloquant */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshSettings(); else setSettings(null);
  }, [isAuthenticated, refreshSettings]);

  const value = useMemo(() => ({
    settings,
    hotelName: settings?.name || tr('Hôtel'),
    currency: settings?.currency || 'FCFA',
    refreshSettings,
    setSettings,
  }), [settings, refreshSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans un AppProvider');
  return ctx;
};
