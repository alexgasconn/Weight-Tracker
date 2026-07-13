import React, { useMemo, useState } from 'react';
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
  const [forecastDays, setForecastDays] = useState<number>(30);
  const prediction = useMemo(() => calculatePrediction(data, 90, forecastDays), [data, forecastDays]);

  if (!prediction) return null;

  const { points, dailyChange, predictedWeight30Days, nextMilestone } = prediction;

  // Build processed points to allow separate styling for past/future segments
  const processed = useMemo(() => {
    if (!points) return [];
    return points.map(p => ({
      ...p,
      predictedPast: p.isFuture ? null : p.predicted,
      predictedFuture: p.isFuture ? p.predicted : null,
      upperFuture: p.isFuture ? p.upperBound : null,
      lowerFuture: p.isFuture ? p.lowerBound : null
    }));
  }, [points]);

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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Predicció Intel·ligent ({forecastDays} dies)
            </h3>
            <div className="bg-gray-50 rounded-md px-2 py-1">
              <span className="text-xs text-gray-500">Horitzó:</span>
              {[30, 60, 90].map(h => (
                <button key={h} onClick={() => setForecastDays(h)} className={`ml-2 text-xs px-2 py-1 rounded ${forecastDays === h ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'} `}>{h}d</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Basada en la tendència dels últims 90 dies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Stats Column */}
        <div className="p-6 space-y-6 flex flex-col justify-center">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <span className="text-xs font-bold uppercase text-purple-800 opacity-60">Projecció a {forecastDays} dies</span>
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
            <ComposedChart data={processed} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="predictionArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
              <ReferenceLine y={data[data.length - 1]?.weight} stroke="#d8b4fe" strokeDasharray="3 3" />

              {/* Small shaded area for predicted trend */}
              <Area dataKey="predicted" stroke="none" fill="url(#predictionArea)" fillOpacity={1} />

              {/* Upper / Lower bounds for future (light dashed lines) */}
              <Line type="monotone" dataKey="upperFuture" stroke="#d8b4fe" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Marge Superior" />
              <Line type="monotone" dataKey="lowerFuture" stroke="#f3e8ff" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Marge Inferior" />

              {/* Historical trend (solid) and future (dashed) separated */}
              <Line type="monotone" dataKey="predictedPast" stroke="#7e22ce" strokeWidth={2} dot={false} name="Tendència Històrica" />
              <Line type="monotone" dataKey="predictedFuture" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Predicció" />

              {/* Actual Weight Dots (only history) */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="transparent"
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
