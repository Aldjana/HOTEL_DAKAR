import { useRef, useState } from 'react';
import { uploadsApi } from '../../services/api/uploadsApi';
import { getErrorMessage } from '../../services/api/client';
import { useT } from '../../i18n';

const OUTLINE = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 disabled:opacity-60';
const MAX = 5 * 1024 * 1024;

// Champ image : envoie le fichier vers Cloudinary (via le backend) et remonte l'URL obtenue.
const ImageUploadField = ({ label, value, onChange, folder = 'misc', onError, className = '', previewClass = 'h-16 w-16', empty }) => {
  const { t } = useT();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const fail = (m) => onError?.(m);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return fail(t('Format non supporté (JPG, PNG, WebP ou GIF)'));
    if (f.size > MAX) return fail(t('Image trop volumineuse (5 Mo maximum)'));
    setBusy(true);
    try { const r = await uploadsApi.image(f, folder); onChange(r.url); } catch (err) { fail(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-[13px] font-medium text-slate-700">{label}</p>}
      <div className="flex items-center gap-4">
        <div className={`flex ${previewClass} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50`}>
          {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <span className="px-1 text-center text-[11px] text-slate-400">{empty ?? t('Aucune image')}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={pick} />
          <button type="button" disabled={busy} className={OUTLINE} onClick={() => ref.current?.click()}>{busy ? t('Envoi...') : value ? t('Changer') : t('Choisir une image')}</button>
          {value && !busy && <button type="button" className={OUTLINE} onClick={() => onChange('')}>{t('Retirer')}</button>}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;
