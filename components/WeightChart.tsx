import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DailyLog } from '../types';

interface WeightChartProps {
  data: DailyLog[];
}

const WeightChart: React.FC<WeightChartProps> = ({ data }) => {
  const chartData = data.filter(log => log.weight !== null || log.tendency !== null);
  
  const allValues = chartData.flatMap(d => [d.weight, d.tendency]).filter(v => v !== null) as number[];

  const yDomain: [number, number] = allValues.length > 0
    ? [Math.floor(Math.min(...allValues)), Math.ceil(Math.max(...allValues))]
    : [0, 100];


  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="dateString" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={yDomain} tickFormatter={(value) => `${value} kg`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#cbd5e1' }}
            formatter={(value: number, name: string) => [`${value.toFixed(2)} kg`, name]}
          />
          <Legend wrapperStyle={{fontSize: "14px"}}/>
          <Line type="monotone" dataKey="weight" name="Peso" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: '#38bdf8' }} activeDot={{ r: 6 }} connectNulls />
          <Line type="monotone" dataKey="tendency" name="Tendencia" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
