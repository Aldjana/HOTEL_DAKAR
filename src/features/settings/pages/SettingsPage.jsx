import { useState } from 'react';
import { Building2, Globe, Receipt, ScrollText, Users } from 'lucide-react';
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
    </div>
  );
};

export default SettingsPage;
