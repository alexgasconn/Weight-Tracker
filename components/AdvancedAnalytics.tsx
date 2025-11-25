import React, { useState } from 'react';
import { WeightRecord } from '../types';
import DistributionChart from './DistributionChart';

interface AdvancedAnalyticsProps {
  data: WeightRecord[];
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ data }) => {
  const [period, setPeriod] = useState<'month' | 'week'>('month');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Distribució i Volatilitat
            </h3>
            <p className="text-sm text-gray-500">Visualitza el rang (Min-Max) i mitjana per entendre l'estabilitat del pes.</p>
          </div>
          
          <div className="bg-gray-100 p-1 rounded-lg flex shrink-0">
             <button
               onClick={() => setPeriod('week')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               Setmanal
             </button>
             <button
               onClick={() => setPeriod('month')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               Mensual
             </button>
          </div>
        </div>

        <DistributionChart data={data} period={period} />
      </div>
    </div>
  );
};

export default AdvancedAnalytics;