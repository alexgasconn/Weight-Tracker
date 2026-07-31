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
  const [alpha, setAlpha] = useState<number>(0.2);
  const [maWindow, setMaWindow] = useState<number>(7);
  const [forestSize, setForestSize] = useState<number>(30);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);
  // single selected model for display: 'Ensemble' or model name
  const [selectedModel, setSelectedModel] = useState<string>('Ensemble');

  const prediction = useMemo(() => calculatePrediction(data, 90, forecastDays, { alpha, maWindow, forestSize }), [data, forecastDays, alpha, maWindow, forestSize]);

  // Load preferred default model from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('preferredPredictionModel');
      if (stored) setDefaultModel(stored);
    } catch (e) {
      // ignore
    }
  }, []);

  // initialize selected model from stored preference
  React.useEffect(() => {
    if (defaultModel) setSelectedModel(defaultModel);
  }, [defaultModel]);

  if (!prediction) return null;

  const { points, dailyChange, predictedWeight30Days, nextMilestone, models } = prediction as any;

  // Build processed points to allow separate styling for past/future segments

  const processed = useMemo(() => {
    if (!points) return [];

    return points.map((p: any, idx: number) => {
      const entry: any = {
        ...p,
        predictedPast: p.isFuture ? null : p.predicted,
        predictedFuture: p.isFuture ? p.predicted : null,
        upperFuture: p.isFuture ? p.upperBound : null,
        lowerFuture: p.isFuture ? p.lowerBound : null
      };

      // attach per-model predicted fields
      if (models) {
        models.forEach((m: any) => {
          const key = `model_${m.name.replace(/\s+/g, '_')}`;
          entry[key] = m.points[idx]?.predicted ?? null;
        });
      }

      return entry;
    });
  }, [points, models]);

  // Domain calculation
  const allValues = points.flatMap(p => [p.weight, p.upperBound, p.lowerBound].filter(v => v !== null) as number[]);
  const minVal = Math.floor(Math.min(...allValues) - 0.5);
  const maxVal = Math.ceil(Math.max(...allValues) + 0.5);

  // Determine displayed projection depending on selectedModel
  let displayedProjection = predictedWeight30Days;
  if (selectedModel && models && selectedModel !== 'Ensemble') {
    const sel = models.find((m: any) => m.name === selectedModel);
    if (sel) {
      const last = sel.points[sel.points.length - 1];
      if (last) displayedProjection = last.predicted;
    }
  }

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
            <div className="ml-4 inline-flex items-center gap-2">
              <label className="text-xs text-gray-500 mr-2">Model:</label>
              {/* Single-selection buttons */}
               <button title="General = mitjana de les prediccions dels models" onClick={() => { setSelectedModel('Ensemble'); try { localStorage.setItem('preferredPredictionModel', 'Ensemble'); } catch { } }} className={`text-xs px-2 py-1 rounded ${selectedModel === 'Ensemble' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'}`}>General (mitjana)</button>
              {models && models.map((m: any) => (
                <button key={m.name} onClick={() => { setSelectedModel(m.name); try { localStorage.setItem('preferredPredictionModel', m.name); } catch { } }} className={`text-xs px-2 py-1 rounded ${selectedModel === m.name ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'}`} style={{ borderColor: '#eee' }}>{m.name}</button>
              ))}
            </div>

            <div className="ml-4 flex items-center gap-3">
              <div className="text-xs text-gray-500">Paràmetre:</div>
              {/* Show only the relevant parameter for the selected model */}
              {selectedModel.toLowerCase().includes('exp') && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-600">α</label>
                  <input type="range" min="0.01" max="1" step="0.01" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} className="w-24" />
                  <span className="text-xs w-10 text-right">{alpha.toFixed(2)}</span>
                </div>
              )}
              {selectedModel.toLowerCase().includes('moving') && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-600">MA</label>
                  <input type="number" min={1} max={30} value={maWindow} onChange={(e) => setMaWindow(Math.max(1, parseInt(e.target.value || '1')))} className="w-16 text-xs p-1 border rounded" />
                </div>
              )}
              {selectedModel.toLowerCase().includes('timeforest') && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-600">Forest</label>
                  <input type="number" min={1} max={200} value={forestSize} onChange={(e) => setForestSize(Math.max(1, parseInt(e.target.value || '1')))} className="w-16 text-xs p-1 border rounded" />
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Basada en la tendència dels últims 90 dies</p>
        </div>
      </div>

      {/* removed separate default selector - selection is handled by the model buttons above */}

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Stats Column */}
        <div className="p-6 space-y-6 flex flex-col justify-center">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <span className="text-xs font-bold uppercase text-purple-800 opacity-60">Projecció a {forecastDays} dies</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-purple-700">{formatNumber(displayedProjection)}</span>
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

              {/* Optional per-model lines (single selected model) */}
              {models && models.map((m: any) => {
                const key = `model_${m.name.replace(/\s+/g, '_')}`;
                return selectedModel === m.name ? (
                  <Line key={m.name} type="monotone" dataKey={key} stroke={m.color || '#999'} strokeWidth={1.5} strokeDasharray="3 3" dot={false} name={m.name} />
                ) : null;
              })}

              {/* Ensemble line (main) shown when Ensemble selected */}
              {selectedModel === 'Ensemble' && <Line type="monotone" dataKey="predictedFuture" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} />}

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
