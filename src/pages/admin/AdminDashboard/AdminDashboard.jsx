import React, { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { FaUsers, FaStore, FaCalendarCheck, FaMoneyBillWave, FaCar, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';
import StatCard from '../../../components/common/StatCard';
import StatusBadge from '../../../components/common/StatusBadge';
import { REVENUE_MONTHLY, USER_GROWTH, VEHICLE_STATUS_PIE, MOCK_BOOKINGS } from '../../../components/data/mockDashboard';
import { useNavigate } from 'react-router-dom';

const ALERTS = [
  { id: 1, type: 'warning', msg: 'Showroom "Xe Tốt Thủ Đức" đang chờ xác minh', action: '/admin/showrooms', actionLabel: 'Xem ngay' },
  { id: 2, type: 'info',    msg: 'Hệ thống AI phát hiện 1 hư hỏng mới trên Honda CR-V BKS 51H-23456', action: '/admin/reports', actionLabel: 'Xem báo cáo' },
  { id: 3, type: 'warning', msg: '3 hồ sơ eKYC đang chờ xét duyệt', action: '/admin/users', actionLabel: 'Xét duyệt' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#111827' }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.name.includes('Doanh') ? `${p.value}M` : p.value}</div>)}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('revenue');

  const recentBookings = MOCK_BOOKINGS.slice(0, 6);

  return (
    <div className="admin-dash">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan hệ thống</h1>
          <p className="page-subtitle">Chào mừng trở lại! Đây là tóm tắt hoạt động hệ thống SmartRent Car.</p>
        </div>
        <div className="page-header-date">Tháng 3, 2026</div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard title="Tổng người dùng"     value="1,247"   icon={<FaUsers />}         color="#6d28d9" trend={12.4}  trendLabel="so tháng trước" />
        <StatCard title="Tổng Showroom"        value="23"      icon={<FaStore />}         color="#0891b2" trend={4.5}   trendLabel="so tháng trước" />
        <StatCard title="Tổng lượt đặt xe"    value="3,891"   icon={<FaCalendarCheck />} color="#00b14f" trend={18.2}  trendLabel="so tháng trước" />
        <StatCard title="Doanh thu hệ thống"  value="2.4 tỷ"  icon={<FaMoneyBillWave />} color="#d97706" trend={21.5}  trendLabel="so tháng trước" />
        <StatCard title="Xe đang hoạt động"   value="48"      icon={<FaCar />}           color="#dc2626" trend={6.7}   trendLabel="so tháng trước" />
        <StatCard title="Chờ duyệt"           value="5"       icon={<FaExclamationTriangle />} color="#f59e0b" subtext="showroom + xe" />
      </div>

      {/* Alerts */}
      {ALERTS.length > 0 && (
        <div className="alert-section">
          <div className="section-title">Cảnh báo cần xử lý</div>
          <div className="alert-list">
            {ALERTS.map(a => (
              <div key={a.id} className={`alert-item ${a.type}`}>
                <MdWarning className="alert-icon" />
                <span className="alert-msg">{a.msg}</span>
                <button className="alert-action" onClick={() => navigate(a.action)}>{a.actionLabel}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card wide">
          <div className="chart-header">
            <div className="chart-title">Doanh thu & lượt đặt xe theo tháng</div>
            <div className="chart-tabs">
              {['revenue', 'bookings'].map(t => (
                <button key={t} className={activeTab === t ? 'active' : ''} onClick={() => setActiveTab(t)}>
                  {t === 'revenue' ? 'Doanh thu' : 'Lượt đặt'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={REVENUE_MONTHLY} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b14f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {activeTab === 'revenue'
                ? <Area type="monotone" dataKey="revenue" name="Doanh thu (triệu VND)" stroke="#00b14f" fill="url(#colorRev)" strokeWidth={2.5} dot={false} />
                : <Area type="monotone" dataKey="bookings" name="Lượt đặt" stroke="#6d28d9" fill="#e0e7ff" strokeWidth={2.5} dot={false} />
              }
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Pie */}
        <div className="chart-card">
          <div className="chart-header"><div className="chart-title">Trạng thái xe</div></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={VEHICLE_STATUS_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {VEHICLE_STATUS_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [value + ' xe', name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {VEHICLE_STATUS_PIE.map(d => (
              <div key={d.name} className="pie-legend-item">
                <span className="pie-dot" style={{ background: d.color }} />
                <span>{d.name}</span>
                <span className="pie-val">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="chart-card" style={{ marginTop: 20 }}>
        <div className="chart-header"><div className="chart-title">Tăng trưởng người dùng (6 tháng gần nhất)</div></div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={USER_GROWTH} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
            <Bar dataKey="renters" name="Khách thuê" fill="#00b14f" radius={[4,4,0,0]} />
            <Bar dataKey="owners"  name="Chủ xe"     fill="#0891b2" radius={[4,4,0,0]} />
            <Bar dataKey="showrooms" name="Showroom" fill="#6d28d9" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent bookings */}
      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div className="section-title">Đặt xe gần đây</div>
          <button className="btn-link" onClick={() => navigate('/admin/transactions')}>Xem tất cả <FaEye /></button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="simple-table">
            <thead><tr><th>Mã</th><th>Khách thuê</th><th>Xe</th><th>Từ</th><th>Đến</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id}>
                  <td><span className="code-badge">{b.id}</span></td>
                  <td>{b.renter}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.vehicle}</td>
                  <td>{b.from}</td>
                  <td>{b.to}</td>
                  <td style={{ fontWeight: 600, color: '#00b14f' }}>{b.total.toLocaleString()}đ</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
