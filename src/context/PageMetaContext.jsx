import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PageMetaContext = createContext({ meta: {}, setMeta: () => {} });

export const PageMetaProvider = ({ children }) => {
  const [meta, setMeta] = useState({});
  const value = useMemo(() => ({ meta, setMeta }), [meta]);
  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>;
};

export const usePageMeta = () => useContext(PageMetaContext);

/** Permet à une page de renseigner un libellé affiché dans le header (ex : n° de réservation). */
export const useReservationLabel = (label) => {
  const { setMeta } = useContext(PageMetaContext);
  useEffect(() => {
    setMeta({ reservationLabel: label || '' });
    return () => setMeta({});
  }, [label, setMeta]);
};
