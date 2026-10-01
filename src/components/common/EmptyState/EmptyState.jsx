import { useT } from '../../../i18n';

const EmptyState = ({ 
  icon = '📭', 
  title, 
  message,
  action = null 
}) => {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg min-h-[300px]">
      <div className="text-6xl mb-4">{typeof icon === 'string' ? icon : <div className="w-16 h-16 text-gray-400">{icon}</div>}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2 m-0">{title ?? t('Aucune donnée')}</h3>
      <p className="text-gray-600 mb-6 m-0 max-w-md">{message ?? t('Il n\'y a aucune donnée à afficher pour le moment.')}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
