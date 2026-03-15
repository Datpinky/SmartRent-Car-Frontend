import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaDownload, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';
import { REVENUE_MONTHLY } from '../../../components/data/mockDashboard';
import { MOCK_SHOWROOM_VEHICLES } from '../../../components/data/mockDashboard';
import '../../admin/AdminDashboard/AdminDashboard.css';

const SHOWROOM_REVENUE = REVENUE_MONTHLY.map(m => ({ ...m, revenue: Math.round(m.revenue * 0.6), expense: Math.round(m.revenue * 0.15), profit: Math.round(m.revenue * 0.45) }));

const RevenueReports = () => {
  const [period, setPeriod] = useState('year');
  const totalRevenue = SHOWROOM_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalProfit  = SHOWROOM_REVENUE.reduce((s, m) => s + m.profit, 0);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Doanh thu & Báo cáo</h1>
          <p className="page-subtitle">Thống kê doanh thu chi tiết của showroom</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline"><FaDownload /> Excel</button>
          <button className="btn-primary"><FaDownload /> PDF</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Tổng doanh thu năm', value: totalRevenue + 'M', color: '#00b14f', icon: <FaMoneyBillWave /> },
          { label: 'Lợi nhuận ước tính', value: totalProfit + 'M', color: '#2563eb', icon: <FaChartLine /> },
          { label: 'Doanh thu tháng 3', value: '145M', color: '#d97706', icon: <FaMoneyBillWave /> },
          { label: 'Tổng chuyến đã hoàn thành', value: '312', color: '#7c3aed', icon: <FaChartLine /> },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: k.color + '20', color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>{k.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-header">
          <div className="chart-title">Doanh thu – Chi phí – Lợi nhuận (triệu VND)</div>
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {['month', 'quarter', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: period === p ? '#fff' : 'transparent', fontWeight: 600, fontSize: '0.75rem', color: period === p ? '#111827' : '#6b7280', cursor: 'pointer' }}>
                {p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={SHOWROOM_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b14f" stopOpacity={0.3} /><stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="proGr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, n) => [v + 'M', n]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
            <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#00b14f" fill="url(#revGr)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="profit"  name="Lợi nhuận" stroke="#2563eb" fill="url(#proGr)" strokeWidth={2}   dot={false} />
            <Area type="monotone" dataKey="expense" name="Chi phí"   stroke="#dc2626" fill="transparent"   strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by vehicle */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-header"><div className="chart-title">Doanh thu theo xe (Top xe)</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="simple-table">
            <thead><tr><th>Tên xe</th><th>BKS</th><th>Loại</th><th>Số chuyến</th><th>Doanh thu ước tính</th><th>Tỷ trọng</th></tr></thead>
            <tbody>
              {MOCK_SHOWROOM_VEHICLES.sort((a, b) => b.trips - a.trips).map(v => {
                const estRevenue = v.price * v.trips;
                const totalTrips = MOCK_SHOWROOM_VEHICLES.reduce((s, x) => s + x.trips, 0);
                const pct = Math.round((v.trips / totalTrips) * 100);
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td><span className="code-badge">{v.plate}</span></td>
                    <td>{v.category}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{v.trips}</td>
                    <td style={{ fontWeight: 700, color: '#00b14f' }}>{(estRevenue).toLocaleString()}K</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#00b14f', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: 28 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueReports;
