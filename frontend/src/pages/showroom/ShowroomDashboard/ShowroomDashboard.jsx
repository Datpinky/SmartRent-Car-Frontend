import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FaCar, FaCalendarCheck, FaMoneyBillWave, FaUsers, FaEye, FaCheckCircle, FaTimes, FaBell } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';
import StatCard from '../../../components/common/StatCard';
import StatusBadge from '../../../components/common/StatusBadge';
import { REVENUE_MONTHLY, VEHICLE_STATUS_PIE, MOCK_BOOKINGS } from '../../../components/data/mockDashboard';
import { useNavigate } from 'react-router-dom';

const SHOWROOM_REVENUE = REVENUE_MONTHLY.map(m => ({ ...m, revenue: Math.round(m.revenue * 0.6) }));

const ALERTS_SHOWROOM = [
  { id: 1, type: 'booking', msg: 'Nguyễn Văn An đặt Toyota Camry – 10/03 → 12/03', action: '/showroom/bookings', actionLabel: 'Xem & Duyệt', urgent: true },
  { id: 2, type: 'return',  msg: 'Toyota Fortuner BKS 51M-56789 sẽ được trả lúc 18:00 hôm nay', action: '/showroom/vehicles', actionLabel: 'Xem xe' },
  { id: 3, type: 'ai',      msg: 'AI phát hiện vết xước mới trên Honda CR-V sau lần thuê gần nhất', action: '/showroom/ai-inspection', actionLabel: 'Xem báo cáo AI', urgent: true },
];

const ShowroomDashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(ALERTS_SHOWROOM);


  return (
    <div className="showroom-dash">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan Showroom</h1>
          <p className="page-subtitle">Showroom Minh Hoàng – Cập nhật lần cuối: 11/03/2026 08:00</p>
        </div>
        <div className="page-header-date">Tháng 3, 2026</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Tổng xe quản lý"    value="45"    icon={<FaCar />}           color="#87ceeb" trend={6.7}  trendLabel="so tháng trước" />
        <StatCard title="Xe đang cho thuê"   value="12"    icon={<FaCar />}           color="#2563eb" trend={9.1}  trendLabel="so tháng trước" />
        <StatCard title="Booking mới hôm nay" value="3"    icon={<FaCalendarCheck />} color="#d97706" subtext="chờ xác nhận" />
        <StatCard title="Doanh thu tháng 3"  value="145M"  icon={<FaMoneyBillWave />} color="#dc2626" trend={14.2} trendLabel="so tháng trước" />
        <StatCard title="Khách hàng mới"     value="18"    icon={<FaUsers />}         color="#7c3aed" trend={22.0} trendLabel="tháng này" />
        <StatCard title="Đánh giá TB"        value="4.8 ★" icon={<FaCheckCircle />}   color="#f59e0b" subtext="từ 156 đánh giá" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alert-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FaBell color="#d97706" />
            <div className="section-title">Cần xử lý ngay</div>
          </div>
          <div className="alert-list">
            {alerts.map(a => (
              <div key={a.id} className={`alert-item ${a.urgent ? 'warning' : 'info'}`}>
                <MdWarning className="alert-icon" />
                <span className="alert-msg">{a.msg}</span>
                <button className="alert-action" onClick={() => navigate(a.action)}>{a.actionLabel}</button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: '0 4px' }} onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}><FaTimes /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card wide">
          <div className="chart-header"><div className="chart-title">Doanh thu theo tháng (triệu VND)</div></div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={SHOWROOM_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="srGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#87ceeb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#87ceeb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v + 'M VND', 'Doanh thu']} />
              <Area type="monotone" dataKey="revenue" stroke="#87ceeb" fill="url(#srGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header"><div className="chart-title">Trạng thái xe</div></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={VEHICLE_STATUS_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={72} paddingAngle={3}>
                {VEHICLE_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' xe', n]} />
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

      {/* Bookings by month */}
      <div className="chart-card" style={{ marginTop: 20 }}>
        <div className="chart-header"><div className="chart-title">Lượt đặt xe theo tháng</div></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={SHOWROOM_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [v, 'Lượt đặt']} />
            <Bar dataKey="bookings" name="Lượt đặt" fill="#87ceeb" radius={[5,5,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent bookings */}
      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div className="section-title">Đặt xe gần đây</div>
          <button className="btn-link" onClick={() => navigate('/showroom/bookings')}>Xem tất cả <FaEye /></button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="simple-table">
            <thead><tr><th>Mã</th><th>Khách thuê</th><th>Xe</th><th>Từ</th><th>Đến</th><th>Tổng</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
            <tbody>
              {MOCK_BOOKINGS.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td><span className="code-badge">{b.id}</span></td>
                  <td>{b.renter}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.vehicle}</td>
                  <td>{b.from}</td><td>{b.to}</td>
                  <td style={{ fontWeight: 600, color: '#87ceeb' }}>{b.total.toLocaleString()}đ</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {b.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" style={{ borderColor: '#0284c7', color: '#0284c7' }} title="Duyệt"><FaCheckCircle /></button>
                        <button className="btn-icon danger" title="Từ chối"><FaTimes /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShowroomDashboard;
