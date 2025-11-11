
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down';
}

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);
const ArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);


const StatCard: React.FC<StatCardProps> = ({ title, value, unit, trend }) => {
  const trendColor = trend === 'up' ? 'text-red-400' : 'text-green-400';
  const trendIcon = trend === 'up' 
    ? <ArrowUpIcon className="w-5 h-5" /> 
    : <ArrowDownIcon className="w-5 h-5" />;

  return (
    <div className="bg-secondary p-5 rounded-xl shadow-lg border border-slate-700 transition-transform hover:scale-105 duration-300">
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <div className="flex items-baseline space-x-2 mt-1">
        <p className="text-3xl font-semibold text-white">{value}</p>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
         {trend && (
          <div className={`flex items-center text-sm font-semibold ${trendColor}`}>
            {trendIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
