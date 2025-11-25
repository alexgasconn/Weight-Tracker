import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, trend, color = 'blue', icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

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
