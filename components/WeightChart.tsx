import React, { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Legend
} from 'recharts';
import { WeightRecord, TimeRange } from '../types';
import { calculateMovingAverage } from '../utils/statsUtils';
import { formatNumber } from '../utils/formatUtils';

interface WeightChartProps {
  data: WeightRecord[];
  timeRange: TimeRange;
}

type SmoothingLevel = 'raw' | 'ma7' | 'ma14' | 'ma30';

const WeightChart: React.FC<WeightChartProps> = ({ data, timeRange }) => {
  const [smoothing, setSmoothing] = useState<SmoothingLevel>('raw');

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutData = data;

    if (timeRange !== TimeRange.ALL) {
      const cutoff = new Date();
      if (timeRange === TimeRange.MONTH1) cutoff.setMonth(now.getMonth() - 1);
      if (timeRange === TimeRange.MONTH3) cutoff.setMonth(now.getMonth() - 3);
      if (timeRange === TimeRange.YEAR1) cutoff.setFullYear(now.getFullYear() - 1);
      cutData = data.filter(d => d.date >= cutoff);
    }

    // Apply smoothing if selected
    if (smoothing === 'raw') return cutData;
    
    const window = smoothing === 'ma7' ? 7 : smoothing === 'ma14' ? 14 : 30;
    return calculateMovingAverage(cutData, window);
  }, [data, timeRange, smoothing]);

  if (filteredData.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No hi ha dades per aquest període</div>;

  // Calculate domain
  const values = filteredData.map(d => (d as any).movingAverage || d.weight);
  const minWeight = Math.min(...values);
  const maxWeight = Math.max(...values);
  const domainMin = Math.floor(minWeight - 1);
  const domainMax = Math.ceil(maxWeight + 1);

  const formatXAxis = (tickItem: Date) => {
    return new Date(tickItem).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
          <p className="font-semibold text-gray-700 mb-1">
            {new Date(label).toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="font-bold text-base">
              {entry.name}: {formatNumber(Number(entry.value))} kg
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentAverage = filteredData.reduce((acc, cur) => acc + ((cur as any).movingAverage || cur.weight), 0) / filteredData.length;

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
         <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center text-xs">
            <span className="px-2 text-gray-500 font-medium mr-1">Suavitzat:</span>
            {[
              { id: 'raw', label: 'Cap (Diari)' },
              { id: 'ma7', label: '7 Dies' },
              { id: 'ma30', label: '30 Dies' },
            ].map((opt) => (
               <button
                key={opt.id}
                onClick={() => setSmoothing(opt.id as SmoothingLevel)}
                className={`px-3 py-1 rounded-md transition-all ${
                  smoothing === opt.id 
                  ? 'bg-white text-blue-600 shadow-sm font-semibold' 
                  : 'text-gray-500 hover:text-gray-900'
                }`}
               >
                 {opt.label}
               </button>
            ))}
         </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              minTickGap={30}
            />
            <YAxis 
              domain={[domainMin, domainMax]} 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              unit="kg"
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36}/>
            
            {/* If raw, show area, otherwise show line for MA */}
            {smoothing === 'raw' ? (
              <Area 
                name="Pes Diari"
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                activeDot={{ r: 6 }}
              />
            ) : (
              <Area
                name={`Mitjana Mòbil (${smoothing === 'ma7' ? '7' : '30'} dies)`}
                type="monotone"
                dataKey="movingAverage"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#colorMa)"
                dot={false}
              />
            )}

            <ReferenceLine y={currentAverage} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Mitjana del període', fill: '#d97706', fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeightChart;
