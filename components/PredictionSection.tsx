import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { WeightRecord } from '../types';
import { calculatePrediction } from '../utils/predictionUtils';
import { formatNumber } from '../utils/formatUtils';

interface PredictionSectionProps {
  data: WeightRecord[];
}

const PredictionSection: React.FC<PredictionSectionProps> = ({ data }) => {
  const prediction = useMemo(() => calculatePrediction(data), [data]);

  if (!prediction) return null;

  const { points, dailyChange, predictedWeight30Days, nextMilestone } = prediction;

  // Domain calculation
  const allValues = points.flatMap(p => [p.weight, p.upperBound, p.lowerBound].filter(v => v !== null) as number[]);
  const minVal = Math.floor(Math.min(...allValues) - 0.5);
  const maxVal = Math.ceil(Math.max(...allValues) + 0.5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-purple-100 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-gray-800 mb-2">
            {new Date(p.date).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          
          {p.weight !== null && (
            <div className="flex justify-between gap-4 mb-1">
              <span className="text-gray-500">Pes Real:</span>
              <span className="font-bold text-gray-800">{formatNumber(p.weight)} kg</span>
            </div>
          )}

          <div className="flex justify-between gap-4">
             <span className={`font-bold ${p.isFuture ? 'text-purple-600' : 'text-blue-600'}`}>
               {p.isFuture ? 'Predicció:' : 'Tendència:'}
             </span>
             <span className="font-mono font-bold">{formatNumber(p.predicted)} kg</span>
          </div>

          {p.isFuture && (
             <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
               Marge probable: {formatNumber(p.lowerBound)} - {formatNumber(p.upperBound)} kg
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  const trendColor = dailyChange < 0 ? 'text-emerald-600' : dailyChange > 0 ? 'text-rose-600' : 'text-gray-600';
  const trendIcon = dailyChange < 0 ? '↘' : dailyChange > 0 ? '↗' : '→';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-purple-50/50 border-b border-purple-100 px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Predicció Intel·ligent (30 dies)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Basada en la tendència dels últims 45 dies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Stats Column */}
        <div className="p-6 space-y-6 flex flex-col justify-center">
           <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <span className="text-xs font-bold uppercase text-purple-800 opacity-60">Projecció a 30 dies</span>
              <div className="flex items-baseline gap-2 mt-1">
                 <span className="text-3xl font-bold text-purple-700">{formatNumber(predictedWeight30Days)}</span>
                 <span className="text-sm font-medium text-purple-600">kg</span>
              </div>
              <div className="text-xs text-purple-600/80 mt-1">
                 Si mantens els hàbits actuals
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <span className="text-xs text-gray-400 block mb-1">Ritme Actual</span>
                 <span className={`text-lg font-bold ${trendColor}`}>
                    {trendIcon} {formatNumber(Math.abs(dailyChange * 7))} <span className="text-xs font-normal text-gray-500">kg/setmana</span>
                 </span>
              </div>
              <div>
                 <span className="text-xs text-gray-400 block mb-1">Pròxim Objectiu</span>
                 {nextMilestone ? (
                   <div>
                     <span className="text-lg font-bold text-gray-800">{nextMilestone.weight} kg</span>
                     <span className="text-xs block text-gray-500">~ {new Date(nextMilestone.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span>
                   </div>
                 ) : (
                   <span className="text-sm text-gray-400 italic">Estable</span>
                 )}
              </div>
           </div>
        </div>

        {/* Chart Column */}
        <div className="p-4 md:col-span-2 h-[320px]">
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={points} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id="predictionArea" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                   <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
               <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' })}
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                  minTickGap={30}
               />
               <YAxis 
                  domain={[minVal, maxVal]} 
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                  unit="kg"
                  width={40}
               />
               <Tooltip content={<CustomTooltip />} />
               
               {/* Reference line for current weight */}
               <ReferenceLine y={points.find(p => p.isFuture)?.predicted} stroke="#d8b4fe" strokeDasharray="3 3" />

               {/* Confidence Interval Area (Between Lower and Upper) */}
               {/* We construct a separate area for the 'cone' */}
               <Area
                 dataKey="upperBound"
                 fill="#f3e8ff"
                 stroke="none"
                 baseValue="dataMin" // Trick to make it fill down, but we overlay lowerBound white? No, simpler to just assume range
               />
               <Area
                  dataKey="lowerBound"
                  fill="#ffffff" 
                  stroke="none"
               />
               {/* Actually better approach for Range in Recharts is slightly complex, 
                   let's just use Area for the spread if possible or just Lines. 
                   Simpler visual: Area from Lower to Upper? 
                   Recharts Area `dataKey` is usually single value. 
                   We will use `range` array [lower, upper] style.
                */}
                <Area
                  dataKey={(d) => [d.lowerBound, d.upperBound]}
                  stroke="none"
                  fill="#d8b4fe"
                  fillOpacity={0.4}
                  name="Marge Error"
                />

               {/* Historical Trend Line (Solid) */}
               <Line 
                  type="monotone" 
                  dataKey={(d) => d.isFuture ? null : d.predicted} 
                  stroke="#7e22ce" 
                  strokeWidth={2} 
                  dot={false}
                  name="Tendència Històrica"
               />

               {/* Future Prediction Line (Dashed) */}
               <Line 
                  type="monotone" 
                  dataKey={(d) => d.isFuture || d === points.filter(x => !x.isFuture).pop() ? d.predicted : null} 
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                  name="Predicció"
               />

               {/* Actual Weight Dots (only history) */}
               <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="transparent" // Invisible line
                  dot={{ r: 2, fill: '#9ca3af', fillOpacity: 0.5 }}
                  activeDot={false}
                  name="Pes Real"
               />
               
             </ComposedChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PredictionSection;
