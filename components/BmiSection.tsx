import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { WeightRecord } from '../types';
import { formatNumber } from '../utils/formatUtils';

interface BmiSectionProps {
  data: WeightRecord[];
  currentBmi: number;
}

// SVG Arc Math Helper
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

const BmiSection: React.FC<BmiSectionProps> = ({ data, currentBmi }) => {
  // BMI Categories and Gauge Configuration
  const MIN_BMI = 15;
  const MAX_BMI = 35;
  
  // Map BMI value to Angle (0 to 180 degrees)
  const mapBmiToAngle = (bmi: number) => {
    const clamped = Math.min(Math.max(bmi, MIN_BMI), MAX_BMI);
    return ((clamped - MIN_BMI) / (MAX_BMI - MIN_BMI)) * 180;
  };

  const currentAngle = mapBmiToAngle(currentBmi);

  // Define segments [Start BMI, End BMI, Color]
  const segments = [
    { start: MIN_BMI, end: 18.5, color: '#93c5fd' }, // Underweight (Blue-300)
    { start: 18.5, end: 25, color: '#34d399' },      // Normal (Green-400)
    { start: 25, end: 30, color: '#fbbf24' },        // Overweight (Amber-400)
    { start: 30, end: MAX_BMI, color: '#f87171' },   // Obese (Red-400)
  ];

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Baix Pes', color: '#3b82f6', textColor: 'text-blue-600', range: '< 18.5' };
    if (bmi < 25) return { label: 'Pes Normal', color: '#10b981', textColor: 'text-emerald-600', range: '18.5 - 24.9' };
    if (bmi < 30) return { label: 'Sobrepès', color: '#f59e0b', textColor: 'text-amber-600', range: '25 - 29.9' };
    return { label: 'Obesitat', color: '#ef4444', textColor: 'text-red-600', range: '30+' };
  };

  const category = getBmiCategory(currentBmi);

  // Filter data for chart (last 6 months for relevance)
  const chartData = useMemo(() => {
    // Take simpler slice for cleaner graph
    return data.slice(-90).map(d => ({
      date: d.date,
      bmi: d.bmi,
      formattedDate: d.date.toLocaleDateString('ca-ES', { month: 'short', day: 'numeric' })
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 p-2 rounded shadow-lg text-xs z-50">
          <p className="text-gray-500 mb-1">{new Date(label).toLocaleDateString('ca-ES')}</p>
          <p className="font-bold text-gray-800">IMC: {formatNumber(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
      <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Composició Corporal (IMC)
        </h3>
      </div>
        
      <div className="p-6 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        
        {/* Gauge Section */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-[280px]">
            <div className="relative w-full max-w-[300px] aspect-[2/1] mb-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
                    {/* Render Segments */}
                    {segments.map((seg, i) => (
                      <path
                        key={i}
                        d={describeArc(100, 100, 85, mapBmiToAngle(seg.start), mapBmiToAngle(seg.end))}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="15"
                        strokeLinecap={i === 0 ? "round" : i === segments.length - 1 ? "round" : "butt"}
                      />
                    ))}

                    {/* Needle */}
                    {/* Rotates around 100, 100. Default (0 deg) points LEFT. */}
                    <g transform={`rotate(${currentAngle}, 100, 100)`}>
                       {/* Line from center (100) towards left. 
                           x1=100 (center), x2=25 (end point). Length = 75. Radius is 85.
                           This keeps it inside the arc. */}
                       <line x1="100" y1="100" x2="25" y2="100" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
                       <circle cx="100" cy="100" r="5" fill="#1f2937" />
                    </g>
                    
                    {/* Labels on the arc (Simplified) */}
                    <text x="15" y="115" className="text-[10px] fill-gray-400 font-medium">15</text>
                    <text x="185" y="115" className="text-[10px] fill-gray-400 font-medium text-right">35</text>
                </svg>
                
                {/* Value Display Overlay */}
                <div className="absolute top-[60%] left-0 right-0 text-center pointer-events-none">
                     <span className={`text-4xl font-extrabold tracking-tight ${category.textColor} drop-shadow-sm`}>
                        {formatNumber(currentBmi)}
                     </span>
                </div>
            </div>

            <div className="text-center mt-2">
                <h4 className={`text-lg font-bold ${category.textColor}`}>{category.label}</h4>
                <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                  Rang òptim: 18.5 - 24.9
                </p>
            </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-100 h-40 self-center"></div>

        {/* History Chart Section */}
        <div className="flex-1 w-full min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-600">Evolució recent</h4>
              <div className="text-xs text-gray-400">Últims 90 dies</div>
          </div>
          
          <div className="h-40 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBmiSimple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  hide 
                />
                <YAxis 
                  domain={['dataMin - 0.2', 'dataMax + 0.2']} 
                  hide 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                
                {/* Reference Lines for Normal Range */}
                <ReferenceLine y={25} stroke="#fbbf24" strokeDasharray="3 3" />
                <ReferenceLine y={18.5} stroke="#34d399" strokeDasharray="3 3" />

                <Area 
                  type="monotone" 
                  dataKey="bmi" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  fill="url(#colorBmiSimple)" 
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
           <div className="mt-2 text-center text-xs text-gray-400 flex justify-between px-2">
              <span>{chartData[0]?.formattedDate}</span>
              <span>{chartData[chartData.length-1]?.formattedDate}</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BmiSection;