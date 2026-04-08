import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaDownload, FaSpinner } from 'react-icons/fa';
import adminService from '../../../services/adminService';

const SystemReports = () => {
  const [period, setPeriod] = useState('year');
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([adminService.getDashboardStats(), adminService.getChartData()])
      .then(([s, c]) => {
        if (!mounted) return;
        setStats(s);
        setCharts(c);
      })
      .catch(() => {
        if (mounted) setError('Không thể tải dữ liệu báo cáo. Vui lòng thử lại.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const revenueMonthly = charts?.revenueMonthly || [];
  const userGrowth = charts?.userGrowth || [];
  const vehicleCategoryPie = charts?.vehicleCategoryPie || [];

  const totalRevenue = revenueMonthly.reduce((s, m) => s + (m.revenue || 0), 0);
  const totalBookings = revenueMonthly.reduce((s, m) => s + (m.bookings || 0), 0);

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
              <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: period === p ? '#fff' : 'transparent', fontWeight: 600, fontSize: '0.8rem', color: period === p ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm'}
              </button>
            ))}
          </div>
          <button type="button" className="btn-outline"><FaDownload aria-hidden="true" /> Xuất Excel</button>
          <button type="button" className="btn-primary"><FaDownload aria-hidden="true" /> Xuất PDF</button>
        </div>
      </div>

      {loading && (
        <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#6b7280' }}>
          <FaSpinner aria-hidden="true" className="animate-spin" /> Đang tải dữ liệu…
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: 24, textAlign: 'center', color: '#dc2626', background: '#fff', borderRadius: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Tổng doanh thu', value: `${totalRevenue}M VND`, color: '#00b14f' },
              { label: 'Tổng lượt đặt xe', value: totalBookings.toLocaleString(), color: '#2563eb' },
              { label: 'Tổng người dùng', value: (stats?.totalUsers ?? 0).toLocaleString(), color: '#6d28d9' },
              { label: 'Xe đang hoạt động', value: (stats?.activeVehicles ?? 0).toLocaleString(), color: '#059669' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>{k.label}</div>
                <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-header"><div className="chart-title">Doanh thu theo tháng (triệu VND)</div></div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueMonthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b14f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [v + 'M', n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu thực tế" stroke="#00b14f" fill="url(#rGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>
            {/* User Growth */}
            <div className="chart-card">
              <div className="chart-header"><div className="chart-title">Tăng trưởng người dùng</div></div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={userGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              {vehicleCategoryPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={vehicleCategoryPie} dataKey="value" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                        {vehicleCategoryPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v + ' xe', n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {vehicleCategoryPie.map(d => (
                      <div key={d.name} className="pie-legend-item">
                        <span className="pie-dot" style={{ background: d.color }} />
                        <span>{d.name}</span>
                        <span className="pie-val">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: '0.85rem' }}>Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemReports;
