import { useT } from '../../../i18n';

// Tableau d'origine ; ajouts : rowKey, align par colonne, lignes cliquables uniquement si onRowClick.
const Table = ({
  columns,
  data,
  onRowClick,
  emptyMessage,
  className = '',
  rowKey = '_id',
}) => {
  const { t } = useT();
  if (!data || data.length === 0) {
    return (
      <div className={`w-full overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
        <div className="p-12 text-center bg-gray-50">
          <p className="m-0 text-gray-500 text-base">{emptyMessage ?? t('Aucune donnée disponible')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-4 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row[rowKey] || rowIndex}
              className={`border-b border-gray-200 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-4 text-gray-600 text-sm ${column.align === 'right' ? 'text-right' : ''}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
