import { useT, getLocale } from '../../i18n';

// Pagination numérotée au style d'origine (‹ 1 2 3 … N ›, page active #0D1520).
export const pageList = (page, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, '...', total];
  if (page >= total - 2) return [1, '...', total - 2, total - 1, total];
  return [1, '...', page, '...', total];
};

// pagination : { page, limit, total, totalPages } ; label : « réservations », « paiements »…
// centered : barre centrée sans texte (cartes de chambres).
const Pagination = ({ pagination, onPageChange, label, centered = false }) => {
  const { t } = useT();
  if (!pagination || pagination.total === 0) return null;
  const { page, limit, total } = pagination;
  const totalPages = Math.max(pagination.totalPages || Math.ceil(total / limit), 1);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const items = ['‹', ...pageList(page, totalPages), '›'];
  const go = (item) => {
    if (item === '‹') return page > 1 && onPageChange(page - 1);
    if (item === '›') return page < totalPages && onPageChange(page + 1);
    if (item !== '...') onPageChange(item);
  };
  const buttons = items.map((item, i) => {
    const disabled = (item === '‹' && page <= 1) || (item === '›' && page >= totalPages) || item === '...';
    return (
      <button
        key={`${item}-${i}`}
        type="button"
        disabled={disabled}
        onClick={() => go(item)}
        aria-label={item === '‹' ? t('Page précédente') : item === '›' ? t('Page suivante') : item === '...' ? undefined : t('Page {n}', { n: item })}
        aria-current={item === page ? 'page' : undefined}
        className={`h-7 min-w-7 rounded px-1 text-[12px] font-semibold ${item === page ? 'bg-[#0D1520] text-white' : 'text-slate-500 hover:bg-slate-100'} ${disabled && item !== '...' ? 'opacity-40' : ''}`}
      >
        {item}
      </button>
    );
  });
  if (centered) return totalPages > 1 ? <div className="mt-6 flex items-center justify-center gap-2">{buttons}</div> : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[12px] text-slate-400">
      <span>{t('Affichage de {from} à {to} sur {total} {label}', { from, to, total: total.toLocaleString(getLocale()), label: t(label ?? 'résultats') })}</span>
      {totalPages > 1 && <div className="flex gap-1">{buttons}</div>}
    </div>
  );
};

export default Pagination;
