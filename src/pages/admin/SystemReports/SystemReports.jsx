import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaDownload } from 'react-icons/fa';
import { REVENUE_MONTHLY, USER_GROWTH, VEHICLE_CATEGORY_PIE } from '../../../components/data/mockDashboard';

const SystemReports = () => {
  const [period, setPeriod] = useState('year');

  const totalRevenue = REVENUE_MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const totalBookings = REVENUE_MONTHLY.reduce((s, m) => s + m.bookings, 0);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Báo cáo hệ thống</h1>
          <p className="page-subtitle">Thống kê và phân tích hiệu suất hoạt động nền tảng</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 9, padding: '3px' }}>
            {['month', 'quarter', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: period === p ? '#fff' : 'transparent', fontWeight: 600, fontSize: '0.8rem', color: period === p ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm'}
              </button>
            ))}
          </div>
          <button className="btn-outline"><FaDownload /> Xuất Excel</button>
          <button className="btn-primary"><FaDownload /> Xuất PDF</button>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Tổng doanh thu 2026', value: `${totalRevenue}M VND`,         sub: '+21.5% so năm trước', color: '#00b14f' },
          { label: 'Tổng lượt đặt xe',   value: totalBookings,                    sub: '+18.2% so năm trước', color: '#2563eb' },
          { label: 'Người dùng mới',      value: '1,247',                          sub: '+12.4% so tháng trước', color: '#6d28d9' },
          { label: 'Tỷ lệ hoàn thành',   value: '89.4%',                          sub: 'Booking hoàn thành', color: '#059669' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 4 }}>↑ {k.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-header"><div className="chart-title">Doanh thu theo tháng (triệu VND)</div></div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={REVENUE_MONTHLY} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b14f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6d28d9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, n) => [v + 'M', n]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
            <Area type="monotone" dataKey="target"  name="Mục tiêu"     stroke="#6d28d9" fill="url(#tGrad)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="revenue" name="Thực tế"      stroke="#00b14f" fill="url(#rGrad)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>
        {/* User Growth */}
        <div className="chart-card">
          <div className="chart-header"><div className="chart-title">Tăng trưởng người dùng</div></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={USER_GROWTH} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="renters"   name="Khách thuê" fill="#00b14f" radius={[3,3,0,0]} />
              <Bar dataKey="owners"    name="Chủ xe"     fill="#0891b2" radius={[3,3,0,0]} />
              <Bar dataKey="showrooms" name="Showroom"   fill="#6d28d9" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Category Pie */}
        <div className="chart-card">
          <div className="chart-header"><div className="chart-title">Phân loại xe</div></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={VEHICLE_CATEGORY_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                {VEHICLE_CATEGORY_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' xe', n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {VEHICLE_CATEGORY_PIE.map(d => (
              <div key={d.name} className="pie-legend-item">
                <span className="pie-dot" style={{ background: d.color }} />
                <span>{d.name}</span>
                <span className="pie-val">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemReports;
