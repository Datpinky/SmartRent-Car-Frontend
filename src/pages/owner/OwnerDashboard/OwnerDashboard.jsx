import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCar, FaMoneyBillWave, FaRoute, FaChartLine } from 'react-icons/fa';
import StatCard from '../../../components/common/StatCard';
import StatusBadge from '../../../components/common/StatusBadge';
import { MOCK_OWNER_VEHICLES, MOCK_OWNER_REVENUE } from '../../../components/data/mockDashboard';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const totalRevenue = MOCK_OWNER_VEHICLES.reduce((s, v) => s + v.revenue, 0);
  const pendingRevenue = MOCK_OWNER_VEHICLES.reduce((s, v) => s + v.pendingRevenue, 0);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Tổng quan chủ xe</h1>
          <p className="page-subtitle">Xin chào! Đây là báo cáo hoạt động xe ký gửi của bạn.</p>
        </div>
        <div className="page-header-date">Tháng 3, 2026</div>
      </div>

      <div className="stats-grid">
        <StatCard title="Xe đang ký gửi"     value={MOCK_OWNER_VEHICLES.length}   icon={<FaCar />}           color="#0891b2" />
        <StatCard title="Xe đang cho thuê"   value={MOCK_OWNER_VEHICLES.filter(v => v.status === 'active').length} icon={<FaCar />} color="#00b14f" />
        <StatCard title="Tổng doanh thu"     value={(totalRevenue / 1000000).toFixed(1) + 'M'} icon={<FaMoneyBillWave />} color="#d97706" trend={8.5} trendLabel="so tháng trước" />
        <StatCard title="Chờ nhận tiền"      value={(pendingRevenue / 1000).toLocaleString() + 'K'} icon={<FaMoneyBillWave />} color="#7c3aed" subtext="Sẽ chuyển vào T4" />
        <StatCard title="Tổng chuyến"        value={MOCK_OWNER_VEHICLES.reduce((s, v) => s + v.trips, 0)} icon={<FaRoute />} color="#059669" trend={14.2} trendLabel="so tháng trước" />
        <StatCard title="Doanh thu tháng 3"  value="2.2M" icon={<FaChartLine />} color="#dc2626" />
      </div>

      {/* Revenue Chart */}
      <div className="chart-card" style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="chart-header">
          <div className="chart-title">Doanh thu – Chi trả theo tháng (VND)</div>
          <button className="btn-link" onClick={() => navigate('/owner/revenue')}>Chi tiết →</button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MOCK_OWNER_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
            <Tooltip formatter={(v, n) => [(v / 1000).toLocaleString() + 'K', n]} />
            <Bar dataKey="revenue" name="Doanh thu"  fill="#0891b2" radius={[4,4,0,0]} />
            <Bar dataKey="payouts" name="Đã chi trả" fill="#00b14f" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicles quick view */}
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Xe của tôi</div>
          <button className="btn-link" onClick={() => navigate('/owner/vehicles')}>Xem tất cả →</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOCK_OWNER_VEHICLES.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f9fafb' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaCar style={{ color: '#0891b2', fontSize: '1.1rem' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>{v.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>BKS: {v.plate} · {v.showroom}</div>
              </div>
              <StatusBadge status={v.status} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#00b14f' }}>{(v.revenue / 1000000).toFixed(1)}M</div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>tổng DT</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
