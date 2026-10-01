import { useState } from 'react';
import { Building2, Globe, HardDrive, Receipt, ScrollText, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useT } from '../../../i18n';
import SettingsTabs from '../components/SettingsTabs';
import HotelTab from '../components/HotelTab';
import BillingTab from '../components/BillingTab';
import ReferenceTab from '../components/ReferenceTab';
import UsersTab from '../components/UsersTab';
import AuditTab from '../components/AuditTab';

const SettingsPage = () => {
  const { can, hasRole } = useAuth();
  const { t } = useT();
  const admin = hasRole('admin');
  const tabs = [
    { id: 'hotel', label: 'Hôtel', icon: Building2 },
    { id: 'billing', label: 'Facturation', icon: Receipt },
    { id: 'reference', label: 'Référentiels', icon: Globe },
    ...(admin ? [{ id: 'users', label: 'Utilisateurs', icon: Users }] : []),
    ...(can('audit.read') ? [{ id: 'audit', label: 'Audit', icon: ScrollText }] : []),
    { id: 'backup', label: 'Sauvegarde', icon: HardDrive },
  ];
  const [tab, setTab] = useState('hotel');

  return (
    <div>
      <div className="mb-5">
        <h2 className="m-0 text-[26px] font-bold text-slate-900">{t('Configuration du système')}</h2>
        <p className="mt-1 text-[13px] text-slate-400">
          {t('Gérez les préférences globales, l\'équipe et les paramètres de facturation de l\'établissement.')}
        </p>
      </div>

      <SettingsTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {tab === 'hotel' && <HotelTab admin={admin} />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'reference' && <ReferenceTab canDeleteTypes={admin} canWriteSources={admin} canDeleteSources={admin} />}
      {tab === 'users' && admin && <UsersTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'backup' && (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 mt-0 flex items-center gap-2 text-[15px] font-semibold"><HardDrive className="h-4 w-4" /> {t('Sauvegarde et restauration')}</h3>
          <p className="mt-0 text-[13px] text-slate-500">{t('La sauvegarde des données se fait côté serveur (hébergeur MongoDB ou script fourni), pas depuis le navigateur :')}</p>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{`cd backend\nnpm run backup            # ${t('exporte toutes les collections en JSON (dossier backups/)')}\nnpm run restore -- <${t('dossier')}>   # ${t('restaure une sauvegarde')}`}</pre>
          <p className="mb-0 text-[12px] text-slate-400">{t('Planifiez ce script (cron) au minimum chaque nuit. Sur MongoDB Atlas, activez aussi les sauvegardes automatiques du cluster.')}</p>
        </section>
      )}
    </div>
  );
};

export default SettingsPage;
