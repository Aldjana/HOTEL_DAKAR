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

  const cell = (column, row) => (column.render ? column.render(row[column.key], row) : row[column.key]);
  const [first, ...rest] = columns;

  return (
    <>
    {/* Mobile : une carte par ligne (1re colonne en titre, les autres en « libellé : valeur ») */}
    <ul className={`m-0 list-none divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white p-0 md:hidden ${className}`}>
      {data.map((row, rowIndex) => (
        <li
          key={row[rowKey] || rowIndex}
          className={`px-4 py-3 text-sm ${onRowClick ? 'cursor-pointer' : ''}`}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
        >
          <div className="mb-1 font-semibold text-gray-800">{cell(first, row)}</div>
          {rest.map((column) => (
            <div key={column.key} className="flex justify-between gap-3 text-gray-600">
              <span className="text-gray-400">{column.label}</span>
              <span className="text-right">{cell(column, row)}</span>
            </div>
          ))}
        </li>
      ))}
    </ul>
    <div className={`hidden w-full overflow-x-auto rounded-lg border border-gray-200 md:block ${className}`}>
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
                  {cell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default Table;
