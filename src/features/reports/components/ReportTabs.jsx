import { useT } from '../../../i18n';

// Onglets : même markup que HousekeepingTabs (d'origine).
const ReportTabs = ({ tabs, activeTab, onTabChange }) => {
  const { t } = useT();
  return (
    <div className="mb-4 flex flex-wrap gap-4 text-[13px]">
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`inline-flex items-center gap-2 pb-2 ${active ? 'border-b-2 border-[#0D1520] font-semibold text-slate-800' : 'text-slate-400'}`}
          >
            <Icon className="h-4 w-4" /> {t(item.label)}
          </button>
        );
      })}
    </div>
  );
};

export default ReportTabs;
