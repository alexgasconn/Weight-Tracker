import React, { useMemo } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { WeightRecord } from '../types';
import { calculateWeekdayStats } from '../utils/statsUtils';
import { formatNumber } from '../utils/formatUtils';

interface WeekdayChartProps {
  data: WeightRecord[];
}

const WeekdayChart: React.FC<WeekdayChartProps> = ({ data }) => {
  const stats = useMemo(() => calculateWeekdayStats(data), [data]);

  // Scales for Weight
  const minWeight = Math.min(...stats.map(s => s.minWeight));
  const maxWeight = Math.max(...stats.map(s => s.maxWeight));
  // Add some padding
  const domainMin = Math.floor(minWeight - 0.5);
  const domainMax = Math.ceil(maxWeight + 0.5);

  const CustomTooltipWeight = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-gray-800 mb-2">{dataPoint.dayName}</p>
          <div className="space-y-1">
             <div className="flex justify-between gap-4">
                <span className="text-gray-500">Màxim:</span>
                <span className="font-mono">{formatNumber(dataPoint.maxWeight)} kg</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-blue-600 font-bold">Mitjana:</span>
                <span className="font-mono font-bold">{formatNumber(dataPoint.avgWeight)} kg</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-gray-500">Mínim:</span>
                <span className="font-mono">{formatNumber(dataPoint.minWeight)} kg</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipDelta = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-gray-800 mb-2">{dataPoint.dayName}</p>
          <div className="flex justify-between gap-4">
             <span className="text-purple-600 font-bold">Variació mitjana:</span>
             <span className={`font-mono font-bold ${dataPoint.avgDelta > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
               {dataPoint.avgDelta > 0 ? '+' : ''}{formatNumber(dataPoint.avgDelta)} kg
             </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Respecte al dia anterior</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[500px] w-full gap-4">
      
      {/* Top Chart: Weight Distribution (Box Plot style) */}
      <div className="flex-1 min-h-0">
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Distribució de Pes (Rang i Mitjana)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={stats}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="dayName" 
              tickFormatter={(val) => val.substring(0, 3)} 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[domainMin, domainMax]} 
              stroke="#9ca3af"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltipWeight />} cursor={{ fill: '#f9fafb' }} />
            
            {/* The "Box" (Range Min-Max) */}
            <Bar 
              dataKey="range" 
              fill="#e0e7ff" 
              barSize={24}
              radius={[4, 4, 4, 4]} 
              name="Rang"
            />

            {/* The Average Line */}
            <Line 
              type="monotone" 
              dataKey="avgWeight" 
              stroke="#4f46e5" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#4f46e5', stroke: 'white', strokeWidth: 2 }}
              name="Mitjana"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Chart: Daily Variation (Delta) */}
      <div className="h-1/3 min-h-[150px] border-t border-gray-100 pt-4">
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Variació Diària (Delta)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="dayName" 
              tickFormatter={(val) => val.substring(0, 3)} 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltipDelta />} cursor={{ fill: '#f9fafb' }} />
            <ReferenceLine y={0} stroke="#d1d5db" />
            <Bar dataKey="avgDelta" name="Variació" barSize={32} radius={[3, 3, 3, 3]}>
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.avgDelta > 0 ? '#fca5a5' : '#6ee7b7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default WeekdayChart;
