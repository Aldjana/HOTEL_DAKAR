import { useEffect, useMemo, useState } from 'react';
import { getLang, trc } from '../i18n';
import { paymentsApi } from '../services/api/paymentsApi';
import { reservationSourcesApi, roomTypesApi } from '../services/api/roomsApi';

// Données de référence (modes de paiement, sources, types de chambre) chargées une fois puis mises en cache.
const cache = {};
const useCached = (key, loader, initial = []) => {
  const lang = getLang();
  const [data, setData] = useState(cache[key] || initial);
  useEffect(() => {
    let alive = true;
    if (!cache[key]) {
      loader().then((d) => { cache[key] = d; if (alive) setData(d); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [key, loader]);
  // Noms par défaut (Espèces, Wave, Chambre Standard…) affichés dans la langue active ; les noms personnalisés restent tels quels.
  return useMemo(() => (lang === 'en' ? data.map((x) => (x?.name ? { ...x, name: trc('status', x.name) } : x)) : data), [data, lang]);
};

const loadMethods = () => paymentsApi.methods();
const loadSources = () => reservationSourcesApi.list({ is_active: 'true' });
const loadTypes = () => roomTypesApi.list({ is_active: 'true' });

export const usePaymentMethods = () => useCached('methods', loadMethods);
export const useReservationSources = () => useCached('sources', loadSources);
export const useRoomTypes = () => useCached('roomTypes', loadTypes);
export const invalidateReference = (key) => { if (key) delete cache[key]; else Object.keys(cache).forEach((k) => delete cache[k]); };
