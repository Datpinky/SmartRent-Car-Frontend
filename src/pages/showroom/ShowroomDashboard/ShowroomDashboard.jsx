import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  LayoutGrid, List, LayoutTemplate, Download, TrendingUp, TrendingDown,
  Search, AlertTriangle, CheckCircle, Clock, Car, Users,
  DollarSign, CalendarCheck, ArrowRight, Star, Bell, X,
  ChevronDown, BarChart2, Activity, Package,
} from 'lucide-react';
import StatCard from '../../../components/common/StatCard';
import StatusBadge from '../../../components/common/StatusBadge';
import DataTable from '../../../components/common/DataTable';
import {
  REVENUE_MONTHLY, VEHICLE_STATUS_PIE, MOCK_BOOKINGS,
  MOCK_SHOWROOM_VEHICLES, MOCK_CONTRACTS, MOCK_SHOWROOMS,
} from '../../../components/data/mockDashboard';
import { useNavigate } from 'react-router-dom';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtVND = (v) => {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return v.toString();
};
const fmtNum = (v) => Number(v).toLocaleString('vi-VN');

const PERIODS = ['Tháng 3', 'Quý 1', '6 tháng', 'Năm 2026'];
const PERIOD_SLICES = { 'Tháng 3': 1, 'Quý 1': 3, '6 tháng': 6, 'Năm 2026': 12 };

// ─── Derived data ────────────────────────────────────────────────────────────
const SHOWROOM_REVENUE = REVENUE_MONTHLY.map(m => ({
  ...m,
  revenue: Math.round(m.revenue * 0.6),
  profit: Math.round(m.revenue * 0.4),
  target: Math.round(m.target * 0.6),
}));

const ALERTS_SHOWROOM = [
  { id: 1, type: 'urgent', msg: 'Nguyễn Văn An đặt Toyota Camry – 10/03 → 12/03', action: '/showroom/bookings', actionLabel: 'Duyệt ngay' },
  { id: 2, type: 'info',   msg: 'Toyota Fortuner 51M-56789 sẽ được trả lúc 18:00 hôm nay', action: '/showroom/vehicles', actionLabel: 'Xem xe' },
  { id: 3, type: 'urgent', msg: 'AI phát hiện vết xước mới trên Honda CR-V', action: '/showroom/ai-inspection', actionLabel: 'Xem báo cáo' },
];

// ─── Tooltip chung ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{fmtNum(p.value)}{p.name?.includes('thu') || p.name?.includes('Doanh') ? 'M' : ''}</span>
        </p>
      ))}
    </div>
  );
};

// ─── SummaryBar ────────────────────────────────────────────────────────────────
const SummaryBar = ({ period }) => {
  const sliceN = PERIOD_SLICES[period] || 12;
  const sliced = SHOWROOM_REVENUE.slice(-sliceN);
  const totalRevenue = sliced.reduce((s, m) => s + m.revenue, 0);
  const totalBookings = MOCK_BOOKINGS.length;
  const avgOrder = totalRevenue > 0 && totalBookings > 0 ? Math.round((totalRevenue * 1_000_000) / totalBookings) : 0;
  const newCustomers = 18;

  const kpis = [
    { label: 'Doanh thu', value: fmtVND(totalRevenue * 1_000_000), trend: 14.2, up: true, icon: <DollarSign size={14} /> },
    { label: 'Tổng đặt xe', value: fmtNum(totalBookings), trend: 9.1, up: true, icon: <CalendarCheck size={14} /> },
    { label: 'Giá trị TB/đơn', value: fmtVND(avgOrder), trend: -2.3, up: false, icon: <BarChart2 size={14} /> },
    { label: 'Khách hàng mới', value: fmtNum(newCustomers), trend: 22.0, up: true, icon: <Users size={14} /> },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex divide-x divide-gray-100 overflow-hidden">
      {kpis.map((k, i) => (
        <div key={i} className="flex-1 flex items-center gap-3 px-5 py-3.5 min-w-0">
          <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {k.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">{k.label}</p>
            <p className="text-[1.1rem] font-extrabold text-gray-900 leading-tight">{k.value}</p>
            <span className={`inline-flex items-center gap-0.5 text-[0.65rem] font-bold px-1.5 py-px rounded-full ${k.up ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
              {k.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {Math.abs(k.trend)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 1 — Overview Grid
// ══════════════════════════════════════════════════════════════════════════════
const Variant1Layout = ({ period, navigate }) => {
  const sliceN = PERIOD_SLICES[period] || 12;
  const sliced = SHOWROOM_REVENUE.slice(-sliceN);
  const totalVehicles = MOCK_SHOWROOM_VEHICLES.length;
  const activeVehicles = MOCK_SHOWROOM_VEHICLES.filter(v => v.status === 'active').length;
  const pendingBookings = MOCK_BOOKINGS.filter(b => b.status === 'pending').length;
  const monthRevenue = SHOWROOM_REVENUE[SHOWROOM_REVENUE.length - 1].revenue;

  const bookingColumns = [
    {
      key: 'id', label: 'Mã đặt xe',
      render: r => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{r.id}</span>
    },
    { key: 'renter', label: 'Khách thuê', accessor: 'renter' },
    {
      key: 'vehicle', label: 'Xe', accessor: 'vehicle',
      render: r => <span className="max-w-[160px] truncate block text-xs text-gray-700">{r.vehicle}</span>
    },
    { key: 'from', label: 'Nhận xe', accessor: 'from' },
    { key: 'to', label: 'Trả xe', accessor: 'to' },
    {
      key: 'total', label: 'Tổng', accessor: 'total',
      render: r => <span className="font-semibold text-primary">{fmtVND(r.total)}</span>
    },
    { key: 'status', label: 'Trạng thái', render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Tổng xe"         value={totalVehicles}  icon={<Car size={18} />}          color="#00b14f" trend={6.7}  trendLabel="so T2" />
        <StatCard title="Đang cho thuê"   value={activeVehicles} icon={<Activity size={18} />}     color="#2563eb" trend={9.1}  trendLabel="so T2" />
        <StatCard title="Booking chờ"     value={pendingBookings}icon={<Clock size={18} />}         color="#d97706" subtext="cần xử lý" />
        <StatCard title="Doanh thu T3"    value={monthRevenue + 'M'} icon={<DollarSign size={18} />} color="#dc2626" trend={14.2} trendLabel="so T2" />
        <StatCard title="Khách hàng mới"  value="18"             icon={<Users size={18} />}        color="#7c3aed" trend={22.0} trendLabel="tháng này" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">Doanh thu &amp; Lợi nhuận (triệu VND)</p>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{period}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sliced} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="v1RevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b14f" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="v1ProfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#00b14f" fill="url(#v1RevGrad)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#2563eb" fill="url(#v1ProfGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-4">Lượt đặt xe</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sliced} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="bookings" name="Lượt đặt" fill="#00b14f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings DataTable */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-800">Đặt xe gần đây</p>
          <button
            onClick={() => navigate('/showroom/bookings')}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Xem tất cả <ArrowRight size={13} />
          </button>
        </div>
        <DataTable
          columns={bookingColumns}
          data={MOCK_BOOKINGS.slice(0, 5)}
          searchable={false}
        />
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 2 — Analytics & Funnel
// ══════════════════════════════════════════════════════════════════════════════
const Variant2Layout = ({ period }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const sliceN = PERIOD_SLICES[period] || 12;
  const sliced = SHOWROOM_REVENUE.slice(-sliceN);

  const filteredBookings = useMemo(() => {
    let d = MOCK_BOOKINGS;
    if (statusFilter !== 'all') d = d.filter(b => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(b => b.renter.toLowerCase().includes(q) || b.vehicle.toLowerCase().includes(q));
    }
    return d;
  }, [search, statusFilter]);

  const FUNNEL = [
    { stage: 'Xem chi tiết xe', count: 1240, pct: 100, abandon: null,   color: '#00b14f' },
    { stage: 'Bắt đầu đặt xe',  count: 620,  pct: 50,  abandon: '50%', color: '#2563eb' },
    { stage: 'Xác nhận thông tin', count: 430, pct: 35, abandon: '31%', color: '#7c3aed' },
    { stage: 'Thanh toán',       count: 180,  pct: 15,  abandon: '58%', color: '#d97706' },
    { stage: 'Hoàn tất đặt xe',  count: 142,  pct: 11,  abandon: '21%', color: '#059669' },
  ];

  const topVehicles = [...MOCK_SHOWROOM_VEHICLES]
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 5);
  const maxTrips = topVehicles[0]?.trips || 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2 flex-1 min-w-[180px]">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm khách thuê hoặc xe..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 w-full"
          />
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3.5 py-2 bg-gray-50 text-sm text-gray-600">
          <ChevronDown size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="active">Đang thuê</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
          {filteredBookings.length} kết quả
        </span>
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-bold text-gray-800">Phễu chuyển đổi đặt xe</p>
            <span className="text-[0.65rem] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{period}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {FUNNEL.map((f, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{f.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{fmtNum(f.count)}</span>
                    {f.abandon && (
                      <span className="text-[0.62rem] text-red-400 bg-red-50 px-1.5 py-px rounded-full">-{f.abandon}</span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${f.pct}%`, background: f.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Tỷ lệ hoàn tất: <span className="font-bold text-gray-700">11.5%</span>
          </p>
        </div>

        {/* Area chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-4">Xu hướng doanh thu (triệu VND)</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={sliced} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="v2RevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b14f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#00b14f" fill="url(#v2RevGrad)" strokeWidth={2.5} dot={false} />
              <ReferenceLine y={sliced.reduce((s, d) => s + d.revenue, 0) / sliced.length} stroke="#94a3b8" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent bookings compact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Đặt xe gần đây</p>
          <div className="flex flex-col gap-2">
            {filteredBookings.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Car size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{b.renter}</p>
                  <p className="text-[0.65rem] text-gray-400 truncate">{b.vehicle}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
            {filteredBookings.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Không có kết quả</p>
            )}
          </div>
        </div>

        {/* Top vehicles by trips */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Top xe theo số chuyến</p>
          <div className="flex flex-col gap-3">
            {topVehicles.map((v, i) => (
              <div key={v.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    <span className="text-gray-400 mr-1">#{i + 1}</span>{v.name}
                  </span>
                  <span className="font-bold text-gray-900 shrink-0">{v.trips} chuyến</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(v.trips / maxTrips) * 100}%`, background: i === 0 ? '#00b14f' : i === 1 ? '#2563eb' : '#7c3aed' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle status pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Trạng thái xe</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={VEHICLE_STATUS_PIE}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={3}
              >
                {VEHICLE_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} xe`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {VEHICLE_STATUS_PIE.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="flex-1 text-gray-600">{d.name}</span>
                <span className="font-bold text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 3 — Executive View
// ══════════════════════════════════════════════════════════════════════════════
const Variant3Layout = ({ period, setPeriod }) => {
  const [alerts, setAlerts] = useState(ALERTS_SHOWROOM);
  const sliceN = PERIOD_SLICES[period] || 12;
  const sliced = SHOWROOM_REVENUE.slice(-sliceN);
  const showroom = MOCK_SHOWROOMS[0];
  const avgRating = (MOCK_SHOWROOM_VEHICLES.reduce((s, v) => s + v.rating, 0) / MOCK_SHOWROOM_VEHICLES.length).toFixed(1);

  const KPI_RAIL = [
    { label: 'Tổng xe',     value: MOCK_SHOWROOM_VEHICLES.length,        icon: <Car size={14} />,          color: '#00b14f' },
    { label: 'Đang thuê',   value: MOCK_SHOWROOM_VEHICLES.filter(v => v.status === 'active').length, icon: <Activity size={14} />, color: '#2563eb' },
    { label: 'Bảo dưỡng',   value: MOCK_SHOWROOM_VEHICLES.filter(v => v.status === 'maintenance').length, icon: <Package size={14} />, color: '#d97706' },
    { label: 'Hợp đồng đã ký', value: MOCK_CONTRACTS.filter(c => c.status === 'signed').length, icon: <CheckCircle size={14} />, color: '#7c3aed' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Top 3-col identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
        {/* Showroom identity */}
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
            {showroom.name[0]}
          </div>
          <div>
            <p className="font-extrabold text-gray-900">{showroom.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{showroom.address}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                <Star size={11} fill="currentColor" /> {avgRating}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{showroom.vehicles} xe</span>
              <span className="text-gray-200">·</span>
              <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                <CheckCircle size={9} /> Đã xác minh
              </span>
            </div>
          </div>
        </div>

        {/* Period tabs */}
        <div className="p-5 flex flex-col justify-center gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kỳ báo cáo</p>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                  period === p
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Quick stat pills */}
        <div className="p-5 flex flex-wrap items-center gap-2">
          {[
            { label: 'Booking hôm nay', value: '3', bg: 'bg-blue-50 text-blue-700' },
            { label: 'Doanh thu T3', value: `${sliced[sliced.length - 1]?.revenue ?? 0}M`, bg: 'bg-emerald-50 text-emerald-700' },
            { label: 'Cần xử lý', value: alerts.length, bg: 'bg-amber-50 text-amber-700' },
            { label: 'Đánh giá TB', value: avgRating + '★', bg: 'bg-purple-50 text-purple-700' },
          ].map(k => (
            <span key={k.label} className={`inline-flex flex-col items-center px-3 py-2 rounded-xl text-xs font-semibold ${k.bg}`}>
              <span className="text-[1rem] font-extrabold">{k.value}</span>
              <span className="font-medium opacity-70">{k.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main content: 2/1 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: stacked charts */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Area + target */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-800">Doanh thu vs Mục tiêu (triệu VND)</p>
              <div className="flex items-center gap-3 text-[0.65rem] text-gray-500">
                <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-primary rounded" />Thực tế</span>
                <span className="flex items-center gap-1"><span className="inline-block w-5 border-t-2 border-dashed border-gray-400" />Mục tiêu</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sliced} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="v3RevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b14f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00b14f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#00b14f" fill="url(#v3RevGrad)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="target" name="Mục tiêu" stroke="#94a3b8" fill="transparent" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly bookings bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-800 mb-4">Lượt đặt xe theo tháng</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={sliced} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Lượt đặt" fill="#00b14f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: KPI rail + pie + alerts */}
        <div className="flex flex-col gap-4">
          {/* KPI rail */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Chỉ số xe</p>
            <div className="flex flex-col gap-2">
              {KPI_RAIL.map((k, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: k.color + '18', color: k.color }}
                  >
                    {k.icon}
                  </span>
                  <span className="text-xs text-gray-600 flex-1">{k.label}</span>
                  <span className="text-sm font-extrabold text-gray-900">{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie + legend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trạng thái xe</p>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={VEHICLE_STATUS_PIE}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                >
                  {VEHICLE_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} xe`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
              {VEHICLE_STATUS_PIE.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[0.65rem]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-gray-600 truncate">{d.name}</span>
                  <span className="ml-auto font-bold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-amber-500" />
              <p className="text-xs font-bold text-gray-800">Cần xử lý ({alerts.length})</p>
            </div>
            <div className="flex flex-col gap-2">
              {alerts.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Không có thông báo</p>
              )}
              {alerts.map(a => (
                <div
                  key={a.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs ${
                    a.type === 'urgent'
                      ? 'bg-red-50 border border-red-100 text-red-800'
                      : 'bg-blue-50 border border-blue-100 text-blue-800'
                  }`}
                >
                  <AlertTriangle size={13} className="shrink-0 mt-px" />
                  <span className="flex-1 leading-snug">{a.msg}</span>
                  <button
                    onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}
                    className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const ShowroomDashboard = () => {
  const navigate = useNavigate();
  const [activeVariant, setActiveVariant] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng 3');

  const VARIANTS = [
    { id: 1, icon: <LayoutGrid size={15} />,     label: 'Tổng quan' },
    { id: 2, icon: <List size={15} />,           label: 'Phân tích' },
    { id: 3, icon: <LayoutTemplate size={15} />, label: 'Điều hành' },
  ];

  return (
    <div className="flex flex-col gap-5 bg-slate-50 min-h-full">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Tổng quan Showroom</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Showroom Minh Hoàng &nbsp;·&nbsp; {selectedPeriod} 2026
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period select */}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-full px-3 py-1.5">
            <ChevronDown size={13} className="text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-700 font-medium cursor-pointer pr-1"
            >
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Export */}
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-200 bg-white rounded-full px-4 py-1.5 hover:border-primary hover:text-primary transition-colors">
            <Download size={14} /> Xuất báo cáo
          </button>

          {/* Variant toggles */}
          <div className="flex items-center border border-gray-200 bg-white rounded-full p-1 gap-0.5">
            {VARIANTS.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveVariant(v.id)}
                title={v.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeVariant === v.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary bar (always visible) ───────────────────────────────────── */}
      <SummaryBar period={selectedPeriod} />

      {/* ── Variant content ─────────────────────────────────────────────────── */}
      {activeVariant === 1 && <Variant1Layout period={selectedPeriod} navigate={navigate} />}
      {activeVariant === 2 && <Variant2Layout period={selectedPeriod} />}
      {activeVariant === 3 && <Variant3Layout period={selectedPeriod} setPeriod={setSelectedPeriod} />}
    </div>
  );
};

export default ShowroomDashboard;
