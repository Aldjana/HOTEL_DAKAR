import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api/client';
import { tr } from '../i18n';

// Charge des données au montage / au changement des dépendances, avec gestion loading + erreur + rechargement.
export const useFetch = (fetcher, deps = [], { enabled = true } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const seq = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError('');
    try {
      const result = await fetcherRef.current();
      if (id === seq.current) setData(result);
    } catch (err) {
      if (id === seq.current) setError(getErrorMessage(err, tr('Chargement impossible')));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) run(); else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, loading, error, reload: run, setData };
};
