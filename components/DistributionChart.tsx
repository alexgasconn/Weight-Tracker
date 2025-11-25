import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { WeightRecord } from '../types';
import { groupData } from '../utils/statsUtils';
import { formatNumber } from '../utils/formatUtils';

interface DistributionChartProps {
  data: WeightRecord[];
  period: 'month' | 'week';
}

const DistributionChart: React.FC<DistributionChartProps> = ({ data, period }) => {
  const stats = useMemo(() => {
    // Reverse groupData result so it flows left-to-right (Oldest to Newest)
    // groupData returns Newest first by default, so we reverse it for the chart x-axis.
    return groupData(data, period).reverse().map(group => ({
      ...group,
      // Create a range array for Area chart [min, max]
      range: [group.min, group.max]
    }));
  }, [data, period]);

  const minWeight = Math.min(...stats.map(d => d.min));
  const maxWeight = Math.max(...stats.map(d => d.max));
  const domainMin = Math.floor(minWeight - 1);
  const domainMax = Math.ceil(maxWeight + 1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-gray-800 mb-2">{dataPoint.label}</p>
          <div className="space-y-1">
             <div className="flex justify-between gap-4">
                <span className="text-rose-500 font-medium">Màxim:</span>
                <span>{formatNumber(dataPoint.max)} kg</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-blue-600 font-bold">Mitjana:</span>
                <span>{formatNumber(dataPoint.avg)} kg</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-emerald-500 font-medium">Mínim:</span>
                <span>{formatNumber(dataPoint.min)} kg</span>
             </div>
             <div className="pt-2 border-t border-gray-100 mt-1 text-xs text-gray-400">
                Variació: {formatNumber(dataPoint.max - dataPoint.min)} kg
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={stats}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="label" 
            stroke="#9ca3af"
            tick={{ fontSize: 10 }}
            interval={period === 'week' ? 4 : 'preserveStartEnd'} // Show fewer labels for weeks to avoid clutter
            tickFormatter={(value) => period === 'week' ? value.split(',')[0] : value}
          />
          <YAxis 
            domain={[domainMin, domainMax]} 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            unit="kg"
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* The Range Area (Min to Max) */}
          <Area
            dataKey="range"
            fill="#e0e7ff"
            stroke="none"
            name="Rang (Min-Max)"
          />
          
          {/* The Average Line */}
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 3, fill: '#4f46e5', strokeWidth: 1, stroke: '#fff' }}
            name="Mitjana"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center">
             <span className="w-3 h-3 bg-indigo-100 mr-1 block"></span> Rang (Min-Max)
          </div>
          <div className="flex items-center">
             <span className="w-4 h-0.5 bg-indigo-600 mr-1 block"></span> Mitjana
          </div>
      </div>
    </div>
  );
};

export default DistributionChart;