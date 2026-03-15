import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtext, icon, color = '#00b14f', trend, trendLabel }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: color + '20', color }}>
        {icon}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-title">{title}</div>
        {(subtext || trendLabel) && (
          <div className="stat-card-sub">
            {trend !== undefined && (
              <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span className="stat-trend-label">{trendLabel}</span>}
            {subtext && !trendLabel && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
