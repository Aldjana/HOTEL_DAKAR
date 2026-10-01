import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button/Button';
import { useT } from '../../i18n';

const ConfirmContext = createContext(null);

// confirm({ title, message, confirmLabel, danger, reasonLabel, reasonRequired }) → Promise<false | true | string>
// Avec reasonLabel, la promesse renvoie le motif saisi (string) ou false.
export const ConfirmProvider = ({ children }) => {
  const { t } = useT();
  const [state, setState] = useState(null);
  const [reason, setReason] = useState('');
  const resolver = useRef(null);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve;
    setReason('');
    setState(opts);
  }), []);

  const close = (value) => { resolver.current?.(value); resolver.current = null; setState(null); };
  const needsReason = !!state?.reasonLabel;
  const reasonMissing = needsReason && state.reasonRequired !== false && !reason.trim();
  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal isOpen={!!state} onClose={() => close(false)} title={state?.title || t('Confirmation')} size="sm">
        {state?.message && <p className="mb-4 whitespace-pre-line text-sm text-slate-600">{state.message}</p>}
        {needsReason && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">{state.reasonLabel}{state.reasonRequired !== false && ' *'}</label>
            <textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>{state?.cancelLabel || t('Annuler')}</Button>
          <Button variant={state?.danger ? 'danger' : 'primary'} disabled={reasonMissing} onClick={() => close(needsReason ? reason.trim() || true : true)}>
            {state?.confirmLabel || t('Confirmer')}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm doit être utilisé dans un ConfirmProvider');
  return ctx;
};
