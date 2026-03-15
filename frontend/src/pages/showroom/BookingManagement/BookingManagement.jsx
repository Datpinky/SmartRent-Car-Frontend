import React, { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaEye, FaCheckCircle, FaTimes, FaArrowRight } from 'react-icons/fa';
import { MOCK_BOOKINGS } from '../../../components/data/mockDashboard';

const BOOKING_FLOW = ['pending', 'approved', 'delivering', 'renting', 'returned', 'completed'];
const FLOW_LABELS = { pending: 'Chờ xác nhận', approved: 'Đã duyệt', delivering: 'Đang giao xe', renting: 'Đang thuê', returned: 'Đã trả xe', completed: 'Hoàn thành', cancelled: 'Đã hủy' };

const BookingManagement = () => {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [viewModal, setViewModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null);

  const approve = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' } : b));
  const reject  = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  const advance = (b) => {
    const idx = BOOKING_FLOW.indexOf(b.status);
    if (idx >= 0 && idx < BOOKING_FLOW.length - 1) setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: BOOKING_FLOW[idx + 1] } : bk));
  };

  const filtered = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

  const columns = [
    { key: 'id', label: 'Mã đặt', render: row => <span className="code-badge">{row.id}</span> },
    { key: 'renter', label: 'Khách thuê', accessor: 'renter', sortable: true },
    { key: 'vehicle', label: 'Xe', accessor: 'vehicle', render: row => <span style={{ fontSize: '0.8rem', maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.vehicle}</span> },
    { key: 'from', label: 'Nhận xe', accessor: 'from' },
    { key: 'to',   label: 'Trả xe',  accessor: 'to' },
    { key: 'days', label: 'Ngày', accessor: 'days', align: 'center' },
    { key: 'total', label: 'Tổng tiền', render: row => <span style={{ fontWeight: 700, color: '#00b14f', whiteSpace: 'nowrap' }}>{row.total.toLocaleString()}đ</span>, sortable: true, accessor: 'total' },
    { key: 'status', label: 'Trạng thái', render: row => <StatusBadge status={row.status} /> },
    { key: 'actions', label: 'Hành động', render: row => (
      <div style={{ display: 'flex', gap: 5 }}>
        <button className="btn-icon" onClick={() => setViewModal(row)} title="Chi tiết"><FaEye /></button>
        {row.status === 'pending' && <>
          <button className="btn-icon" style={{ borderColor: '#059669', color: '#059669' }} onClick={() => approve(row.id)} title="Duyệt"><FaCheckCircle /></button>
          <button className="btn-icon danger" onClick={() => setRejectModal(row)} title="Từ chối"><FaTimes /></button>
        </>}
        {['approved', 'delivering', 'renting', 'returned'].includes(row.status) && (
          <button className="btn-icon" style={{ borderColor: '#2563eb', color: '#2563eb', fontSize: '0.72rem', whiteSpace: 'nowrap', padding: '5px 8px' }} onClick={() => advance(row)} title={`Chuyển sang: ${FLOW_LABELS[BOOKING_FLOW[BOOKING_FLOW.indexOf(row.status) + 1]]}`}>
            <FaArrowRight />
          </button>
        )}
      </div>
    )},
  ];

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Quản lý đặt xe</h1>
          <p className="page-subtitle">Theo dõi và xử lý tất cả booking của showroom</p>
        </div>
        {pendingCount > 0 && <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>{pendingCount} booking chờ xác nhận</div>}
      </div>

      {/* Booking Flow visual */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #f0f0f0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 600 }}>
          {BOOKING_FLOW.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: bookings.some(b => b.status === s) ? '#00b14f' : '#e5e7eb' }} />
                <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{FLOW_LABELS[s]}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827' }}>{bookings.filter(b => b.status === s).length}</span>
              </div>
              {i < BOOKING_FLOW.length - 1 && <div style={{ height: 1, background: '#e5e7eb', flex: 2 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'renting', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 50, border: '1.5px solid', borderColor: statusFilter === s ? '#00b14f' : '#e5e7eb', background: statusFilter === s ? '#00b14f' : '#fff', color: statusFilter === s ? '#fff' : '#374151', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            {s === 'all' ? 'Tất cả' : FLOW_LABELS[s] || s}
            {s !== 'all' && <span style={{ marginLeft: 5, opacity: 0.7 }}>({bookings.filter(b => b.status === s).length})</span>}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} searchPlaceholder="Tìm theo tên khách, xe..." />

      {/* Detail Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Chi tiết đặt xe" width={500}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="code-badge">{viewModal.id}</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginTop: 6 }}>{viewModal.vehicle}</div>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            {[
              ['Khách thuê', viewModal.renter], ['Thời gian nhận', viewModal.from],
              ['Thời gian trả', viewModal.to], ['Số ngày', viewModal.days],
              ['Tổng tiền', viewModal.total.toLocaleString() + 'đ'],
              ['Trạng thái TT', viewModal.payStatus],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              {viewModal.status === 'pending' && <>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => { reject(viewModal.id); setViewModal(null); }}>Từ chối</button>
                <button className="btn-success" style={{ flex: 1 }} onClick={() => { approve(viewModal.id); setViewModal(null); }}>Phê duyệt</button>
              </>}
              {['approved', 'delivering', 'renting', 'returned'].includes(viewModal.status) && (
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => { advance(viewModal); setViewModal(null); }}>
                  Chuyển trạng thái: {FLOW_LABELS[BOOKING_FLOW[BOOKING_FLOW.indexOf(viewModal.status) + 1]]} <FaArrowRight />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject confirm */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Xác nhận từ chối đặt xe" width={420}
        footer={<><button className="btn-outline" onClick={() => setRejectModal(null)}>Hủy bỏ</button><button className="btn-danger" onClick={() => { reject(rejectModal.id); setRejectModal(null); }}>Xác nhận từ chối</button></>}
      >
        {rejectModal && <p style={{ fontSize: '0.85rem', color: '#374151' }}>Bạn đang từ chối booking <b>{rejectModal.id}</b> của khách hàng <b>{rejectModal.renter}</b>. Hành động này không thể hoàn tác.</p>}
      </Modal>
    </div>
  );
};

export default BookingManagement;
