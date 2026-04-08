import React, { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaEye, FaDownload, FaFilter } from 'react-icons/fa';
import { MOCK_TRANSACTIONS } from '../../../components/data/mockDashboard';

const PAYMENT_METHOD_COLORS = { 'Ví điện tử': '#6d28d9', 'Thẻ tín dụng': '#2563eb', 'Chuyển khoản': '#0891b2' };

const TransactionMonitor = () => {
  const [transactions] = useState(MOCK_TRANSACTIONS);
  const [viewModal, setViewModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all' ? transactions : transactions.filter(t => t.status === statusFilter);

  const totalRevenue = transactions.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0);

  const columns = [
    { key: 'id', label: 'Mã GD', render: row => <span className="code-badge">{row.id}</span> },
    { key: 'bookingId', label: 'Mã đặt xe', render: row => <span className="code-badge">{row.bookingId}</span> },
    { key: 'renter', label: 'Khách thuê', accessor: 'renter', sortable: true },
    { key: 'showroom', label: 'Showroom', accessor: 'showroom', sortable: true },
    { key: 'amount', label: 'Số tiền', render: row => <span style={{ fontWeight: 700, color: '#00b14f' }}>{row.amount.toLocaleString()}đ</span>, sortable: true, accessor: 'amount' },
    { key: 'method', label: 'Phương thức', render: row => (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 50,
        background: (PAYMENT_METHOD_COLORS[row.method] || '#6b7280') + '18',
        color: PAYMENT_METHOD_COLORS[row.method] || '#6b7280' }}>
        {row.method}
      </span>
    )},
    { key: 'status', label: 'Trạng thái', render: row => <StatusBadge status={row.status} /> },
    { key: 'date', label: 'Thời gian', accessor: 'date' },
    { key: 'actions', label: '', render: row => <button type="button" className="btn-icon" onClick={() => setViewModal(row)} title="Xem chi tiết" aria-label="Xem chi tiết"><FaEye /></button> },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Giám sát giao dịch</h1>
          <p className="page-subtitle">Theo dõi tất cả giao dịch thanh toán trên nền tảng</p>
        </div>
        <button type="button" className="btn-outline"><FaDownload aria-hidden="true" /> Xuất báo cáo</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng giao dịch', val: transactions.length, color: '#374151' },
          { label: 'Thành công',     val: transactions.filter(t => t.status === 'paid').length, color: '#059669' },
          { label: 'Đang xử lý',    val: transactions.filter(t => t.status === 'processing').length, color: '#2563eb' },
          { label: 'Thất bại',      val: transactions.filter(t => t.status === 'failed').length, color: '#dc2626' },
          { label: 'Tổng doanh thu', val: totalRevenue.toLocaleString() + 'đ', color: '#00b14f' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 16px', border: '1px solid #f0f0f0', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div className="tabular-nums" style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color, marginTop: 2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <FaFilter aria-hidden="true" style={{ color: '#9ca3af', alignSelf: 'center' }} />
        {['all', 'paid', 'processing', 'failed'].map(s => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} style={{
            padding: '5px 14px', borderRadius: 50, border: '1.5px solid',
            borderColor: statusFilter === s ? '#00b14f' : '#e5e7eb',
            background: statusFilter === s ? '#00b14f' : '#fff',
            color: statusFilter === s ? '#fff' : '#374151',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          }}>
            {s === 'all' ? 'Tất cả' : s === 'paid' ? 'Thành công' : s === 'processing' ? 'Đang xử lý' : 'Thất bại'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} searchPlaceholder="Tìm theo khách thuê, showroom…" />

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Chi tiết giao dịch" width={460}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: viewModal.status === 'paid' ? '#f0fdf4' : viewModal.status === 'failed' ? '#fef2f2' : '#eff6ff', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 800, color: viewModal.status === 'paid' ? '#059669' : viewModal.status === 'failed' ? '#dc2626' : '#2563eb' }}>{viewModal.amount.toLocaleString()}đ</div>
              <StatusBadge status={viewModal.status} />
            </div>
            {[
              ['Mã giao dịch', viewModal.id], ['Mã đặt xe', viewModal.bookingId],
              ['Khách thuê', viewModal.renter], ['Showroom', viewModal.showroom],
              ['Phương thức', viewModal.method], ['Thời gian', viewModal.date],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionMonitor;
