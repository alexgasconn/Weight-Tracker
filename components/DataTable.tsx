import React from 'react';
import type { DailyLog } from '../types';

interface DataTableProps {
  data: DailyLog[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const formatValue = (value: number | null) => {
    if (value === null) return '–';
    return value.toFixed(2).replace('.', ',');
  }
  
  return (
    <div className="overflow-x-auto max-h-[400px]">
      <table className="w-full text-sm text-left text-slate-400">
        <thead className="text-xs text-slate-300 uppercase bg-slate-700 sticky top-0">
          <tr>
            <th scope="col" className="px-6 py-3">Fecha</th>
            <th scope="col" className="px-6 py-3 text-right">Peso (kg)</th>
            <th scope="col" className="px-6 py-3 text-right">Tendencia (kg)</th>
          </tr>
        </thead>
        <tbody>
          {data.slice().reverse().map((log, index) => (
            <tr key={index} className="bg-secondary border-b border-slate-700 hover:bg-slate-700/50">
              <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                {log.date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
              <td className="px-6 py-4 text-right font-bold text-accent">{formatValue(log.weight)}</td>
              <td className="px-6 py-4 text-right text-amber-400">{formatValue(log.tendency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
