import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { ROLE_LABELS } from '../../../utils/permissions';
import { useT } from '../../../i18n';
import { formatDateTimeLocal, fullName, initials } from '../../../utils/format';

const ROLE_CLASS = { admin: 'bg-[#0D1520] text-white', manager: 'bg-slate-200 text-slate-700' };

const UsersTable = ({ users, meId, onEdit, onReset, onRemove }) => {
  const { t } = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-[13px]">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            <th className="py-2 font-semibold">{t('Utilisateur')}</th>
            <th className="py-2 font-semibold">{t('Rôle')}</th>
            <th className="py-2 font-semibold">{t('Statut')}</th>
            <th className="py-2 font-semibold">{t('Dernière connexion')}</th>
            <th className="py-2 font-semibold">{t('Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-t border-slate-100">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold">{initials(user)}</div>
                  <div>
                    <div className="font-semibold">{fullName(user)}{user._id === meId && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{t('Vous')}</span>}</div>
                    <div className="text-[12px] text-slate-400">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="py-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ROLE_CLASS[user.role] || 'bg-slate-100 text-slate-500'}`}>{ROLE_LABELS[user.role] || user.role}</span>
              </td>
              <td className="py-3">
                <span className="inline-flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
                  {user.is_active ? t('Actif') : t('Désactivé')}
                </span>
              </td>
              <td className="py-3 text-slate-500">{user.last_login ? formatDateTimeLocal(user.last_login) : t('Jamais')}</td>
              <td className="py-3">
                <div className="flex gap-3 text-slate-400">
                  <button type="button" title={t('Modifier')} onClick={() => onEdit(user)}><Pencil className="h-4 w-4" /></button>
                  <button type="button" title={t('Réinitialiser le mot de passe')} onClick={() => onReset(user)}><KeyRound className="h-4 w-4" /></button>
                  {user._id !== meId && <button type="button" title={t('Supprimer')} onClick={() => onRemove(user)}><Trash2 className="h-4 w-4" /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
