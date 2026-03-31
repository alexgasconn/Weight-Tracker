import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple';
  icon?: React.ReactNode;
  compact?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, trend, color = 'blue', icon, compact }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-xl border ${colorClasses[color]} shadow-sm`}>
        <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight mb-0.5 truncate">{title}</p>
        <h3 className="text-lg font-black leading-none">{value}</h3>
        {subtitle && (
          <p className="text-[10px] mt-1 opacity-80 font-medium truncate">
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-80 mb-1 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        {icon && <div className="p-2 bg-white bg-opacity-40 rounded-lg">{icon}</div>}
      </div>
      {subtitle && (
        <div className="mt-3 flex items-center text-sm font-medium">
          {trend === 'up' && <span className="mr-1">↑</span>}
          {trend === 'down' && <span className="mr-1">↓</span>}
          <span className="opacity-75">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
