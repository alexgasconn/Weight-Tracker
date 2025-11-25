import React, { useMemo, useState } from 'react';
import { WeightRecord, StatGroup } from '../types';
import { groupData } from '../utils/statsUtils';
import { formatNumber } from '../utils/formatUtils';

interface AggregatedStatsProps {
  data: WeightRecord[];
}

type SortKey = keyof StatGroup | 'diff' | 'rangeVal';
type SortDirection = 'asc' | 'desc';

interface EnrichedStatGroup extends StatGroup {
  diff: number; // Difference from previous chronological period
  rangeVal: number; // Max - Min
}

const AggregatedStats: React.FC<AggregatedStatsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'year' | 'month' | 'week' | 'day'>('month');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'firstDate', direction: 'desc' });

  // 1. Group Data
  const rawGroups = useMemo(() => {
    return groupData(data, activeTab);
  }, [data, activeTab]);

  // 2. Enrich with Delta (Diff) - MUST be done on chronologically sorted data first
  const enrichedGroups = useMemo(() => {
    // rawGroups comes sorted Newest -> Oldest from groupData. 
    // We iterate to calculate diff based on the "next" item in the array (which is the previous time period).
    return rawGroups.map((group, idx) => {
      const prevPeriodGroup = rawGroups[idx + 1];
      const diff = prevPeriodGroup ? group.avg - prevPeriodGroup.avg : 0;
      const rangeVal = group.max - group.min;
      
      return {
        ...group,
        diff,
        rangeVal
      } as EnrichedStatGroup;
    });
  }, [rawGroups]);

  // 3. Sort Data based on user selection
  const sortedGroups = useMemo(() => {
    const sorted = [...enrichedGroups];
    sorted.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof EnrichedStatGroup];
      let bValue: any = b[sortConfig.key as keyof EnrichedStatGroup];

      // Handle specific date sorting if needed (though firstDate is a date object)
      if (sortConfig.key === 'firstDate') {
        aValue = a.firstDate.getTime();
        bValue = b.firstDate.getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [enrichedGroups, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1 text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Històric i Estadístiques
        </h3>
        <div className="flex bg-gray-200 p-1 rounded-lg overflow-x-auto">
          {(['day', 'week', 'month', 'year'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
              }`}
            >
              {tab === 'day' ? 'Diari' : tab === 'week' ? 'Setmanal' : tab === 'month' ? 'Mensual' : 'Anual'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-gray-50/50">
        {activeTab === 'year' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedGroups.map((group) => (
              <YearCard key={group.key} group={group} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th 
                      onClick={() => handleSort('firstDate')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      {activeTab === 'month' ? 'Mes' : activeTab === 'week' ? 'Setmana' : 'Dia'} <SortIcon columnKey="firstDate" />
                    </th>
                    <th 
                      onClick={() => handleSort('avg')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      {activeTab === 'day' ? 'Pes (kg)' : 'Mitjana (kg)'} <SortIcon columnKey="avg" />
                    </th>
                    <th 
                      onClick={() => handleSort('diff')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Variació <SortIcon columnKey="diff" />
                    </th>
                    <th 
                      onClick={() => handleSort('rangeVal')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      {activeTab === 'day' ? 'Rang' : 'Rang (Min - Màx)'} <SortIcon columnKey="rangeVal" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedGroups.map((group) => (
                    <tr key={group.key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{group.label}</span>
                          {activeTab !== 'day' && (
                            <span className="text-xs text-gray-400">
                              {group.firstDate.toLocaleDateString('ca-ES')} - {group.lastDate.toLocaleDateString('ca-ES')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-800">{formatNumber(group.avg)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {group.diff !== 0 ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              group.diff < 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : group.diff > 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {group.diff > 0 ? '↑' : group.diff < 0 ? '↓' : ''} {formatNumber(Math.abs(group.diff))} kg
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {activeTab === 'day' ? (
                           <span className="text-gray-400">-</span>
                        ) : (
                           <span className="font-mono text-xs">{formatNumber(group.min)} - {formatNumber(group.max)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const YearCard: React.FC<{ group: StatGroup }> = ({ group }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <h4 className="text-xl font-bold text-gray-800">{group.label}</h4>
      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
        {group.count} registres
      </span>
    </div>
    <div className="flex items-baseline gap-1 mb-4">
      <span className="text-3xl font-bold text-blue-600">{formatNumber(group.avg)}</span>
      <span className="text-sm text-gray-500 font-medium">kg (mitjana)</span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
      <div>
        <span className="text-gray-400 block text-xs uppercase tracking-wider">Mínim</span>
        <span className="font-semibold text-emerald-600">{formatNumber(group.min)} kg</span>
      </div>
      <div>
        <span className="text-gray-400 block text-xs uppercase tracking-wider">Màxim</span>
        <span className="font-semibold text-rose-600">{formatNumber(group.max)} kg</span>
      </div>
    </div>
  </div>
);

export default AggregatedStats;