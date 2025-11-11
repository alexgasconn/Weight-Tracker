import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeightRangeData } from '../types';

interface WeeklyRangeChartProps {
  data: WeightRangeData[];
}

const WeeklyRangeChart: React.FC<WeeklyRangeChartProps> = ({ data }) => {
  const allValues = data.flatMap(d => d.range);

  const yDomain: [number, number] = allValues.length > 0
    ? [Math.floor(Math.min(...allValues)) -1, Math.ceil(Math.max(...allValues)) + 1]
    : [60, 90];


  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="periodLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={yDomain} tickFormatter={(value) => `${value} kg`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#cbd5e1' }}
            formatter={(value: [number, number], name: string) => [`${value[0].toFixed(2)}kg - ${value[1].toFixed(2)}kg`, name]}
            labelFormatter={(label) => `Semana del ${label}`}
          />
          <Area type="monotone" dataKey="range" name="Rango (Mín-Máx)" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyRangeChart;
