import React from 'react';

const StatCard = ({ title, value, subtext, icon, color = '#00b14f', trend, trendLabel }) => {
  return (
    <div className="bg-white rounded-[14px] p-5 flex items-center gap-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)] border border-[#f0f0f0] transition-shadow duration-200 hover:shadow-md">
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[1.4rem] shrink-0"
        style={{ background: color + '20', color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[1.6rem] font-extrabold text-gray-900 leading-none">{value}</div>
        <div className="text-[0.82rem] text-gray-500 mt-0.5 font-medium">{title}</div>
        {(subtext || trendLabel) && (
          <div className="flex items-center gap-1.5 mt-1">
            {trend !== undefined && (
              <span className={`text-[0.72rem] font-bold px-1.5 py-px rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span className="text-[0.72rem] text-gray-400">{trendLabel}</span>}
            {subtext && !trendLabel && <span className="text-[0.72rem] text-gray-400">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
