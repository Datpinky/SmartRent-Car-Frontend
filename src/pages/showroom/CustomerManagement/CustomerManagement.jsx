import React from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import { FaStar, FaRoute } from 'react-icons/fa';
import { MOCK_USERS } from '../../../components/data/mockDashboard';

const CUSTOMERS = MOCK_USERS.filter(u => u.role === 'renter').map((u, i) => ({
  ...u,
  lastBooking: ['10/03/2026', '08/03/2026', '05/03/2026', '01/03/2026'][i % 4] || '28/02/2026',
  totalSpent: [2520000, 997500, 1890000, 2205000, 4410000, 1050000][i % 6],
  avgRating: [4.8, 4.5, 4.9, 4.2, 5.0, 4.6][i % 6],
}));

const CustomerManagement = () => {
  const columns = [
    { key: 'name', label: 'Khách hàng', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
          {row.name.split(' ').slice(-1)[0][0]}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#111827' }}>{row.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.email}</div>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Điện thoại', accessor: 'phone' },
    { key: 'bookings', label: 'Chuyến', render: row => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaRoute size={12} color="#9ca3af" />{row.bookings}</span>
    ), sortable: true, accessor: 'bookings', align: 'center' },
    { key: 'totalSpent', label: 'Tổng chi tiêu', render: row => <span style={{ fontWeight: 700, color: '#00b14f' }}>{row.totalSpent.toLocaleString()}đ</span>, sortable: true, accessor: 'totalSpent' },
    { key: 'avgRating', label: 'Đánh giá', render: row => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#d97706', fontSize: '0.82rem' }}>
        <FaStar size={11} /> {row.avgRating}
      </span>
    )},
    { key: 'lastBooking', label: 'Lần cuối thuê', accessor: 'lastBooking' },
    { key: 'kyc', label: 'eKYC', render: row => <StatusBadge status={row.kyc} /> },
    { key: 'status', label: 'TK', render: row => <StatusBadge status={row.status} /> },
  ];

  const totalRevenue = CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0);
  const avgBookings  = (CUSTOMERS.reduce((s, c) => s + c.bookings, 0) / CUSTOMERS.length).toFixed(1);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Quản lý Khách hàng</h1>
          <p className="page-subtitle">Danh sách khách hàng đã và đang thuê xe tại showroom</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng khách hàng', val: CUSTOMERS.length, color: '#2563eb' },
          { label: 'Tổng doanh thu từ khách', val: totalRevenue.toLocaleString() + 'đ', color: '#00b14f' },
          { label: 'Trung bình chuyến/người', val: avgBookings, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 18px', border: '1px solid #f0f0f0', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={CUSTOMERS} searchPlaceholder="Tìm khách hàng..." />
    </div>
  );
};

export default CustomerManagement;
