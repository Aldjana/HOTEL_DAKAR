import { useEffect, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { clientsApi } from '../../../services/api/clientsApi';
import { fullName } from '../../../utils/format';
import { useDebounce } from '../../../hooks/useDebounce';
import ClientFormModal from '../../clients/components/ClientFormModal';
import { useT } from '../../../i18n';

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-300 focus:border-slate-300';

// Recherche de client (nom, téléphone, email) avec création rapide.
const ClientPicker = ({ value, onChange, disabled, error }) => {
  const { t } = useT();
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 300);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    if (debounced.trim().length < 2) { setResults([]); return undefined; }
    clientsApi.search(debounced.trim()).then((r) => alive && setResults(r)).catch(() => alive && setResults([]));
    return () => { alive = false; };
  }, [debounced]);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  if (value) {
    return (
      <div className={`flex h-11 items-center justify-between rounded-lg border bg-slate-50 px-3 ${error ? 'border-red-400' : 'border-slate-200'}`}>
        <div className="min-w-0 truncate text-[13px] text-slate-800">
          <span className="font-semibold">{fullName(value)}</span>
          {value.is_vip && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">VIP</span>}
          {value.company && <span className="ml-2 text-slate-500">{value.company}</span>}
        </div>
        {!disabled && <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-slate-700" aria-label={t('Changer de client')}><X className="h-4 w-4" /></button>}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={term} onChange={(e) => { setTerm(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={t('Rechercher un client par nom, téléphone, email…')} className={`${inputClass} pl-10 ${error ? 'border-red-400' : ''}`} />
        </div>
        <button type="button" onClick={() => setCreating(true)} className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700"><Plus className="h-4 w-4" /> {t('Nouveau client')}</button>
      </div>
      {open && debounced.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {results.length === 0 ? <p className="m-0 px-3 py-3 text-[13px] text-slate-500">{t('Aucun client trouvé. Créez-le avec « Nouveau client ».')}</p> : results.map((c) => (
            <button key={c._id} type="button" onClick={() => { onChange(c); setOpen(false); setTerm(''); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">
              <span className="block text-[13px] font-medium text-slate-800">{fullName(c)}</span>
              <span className="block text-[12px] text-slate-500">{[c.company, c.phone, c.email].filter(Boolean).join(' · ')}</span>
            </button>
          ))}
        </div>
      )}
      <ClientFormModal isOpen={creating} onClose={() => setCreating(false)} onSaved={(c) => { onChange(c); setCreating(false); }} />
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </div>
  );
};

export default ClientPicker;
