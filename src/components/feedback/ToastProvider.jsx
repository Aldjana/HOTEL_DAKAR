import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useT, tr } from '../../i18n';

const ToastContext = createContext(null);
const STYLES = {
  success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-900', Icon: CheckCircle2, icon: 'text-emerald-600' },
  error: { cls: 'border-red-200 bg-red-50 text-red-900', Icon: XCircle, icon: 'text-red-600' },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle, icon: 'text-amber-600' },
  info: { cls: 'border-sky-200 bg-sky-50 text-sky-900', Icon: Info, icon: 'text-sky-600' },
};

export const ToastProvider = ({ children }) => {
  const { t: tt } = useT();
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message, duration) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), duration ?? (type === 'error' ? 7000 : 4000));
  }, [remove]);

  const api = useMemo(() => ({
    success: (m, d) => push('success', m, d),
    error: (m, d) => push('error', m, d),
    warning: (m, d) => push('warning', m, d),
    info: (m, d) => push('info', m, d),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const { cls, Icon, icon } = STYLES[t.type];
          return (
            <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${cls}`}>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} />
              <div className="flex-1 break-words">{tr(t.message)}</div>
              <button type="button" onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-700" aria-label={tt('Fermer')}><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return ctx;
};
