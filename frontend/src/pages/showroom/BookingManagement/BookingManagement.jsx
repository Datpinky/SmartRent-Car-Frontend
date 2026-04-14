import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaEye, FaCheckCircle, FaTimes, FaArrowRight, FaSpinner } from 'react-icons/fa';
import bookingService from '../../../services/bookingService';
import { useAuth } from '../../../contexts/AuthContext';

const BOOKING_FLOW = ['pending', 'approved', 'delivering', 'renting', 'returned', 'completed'];
const FLOW_LABELS = {
  pending: 'Chờ xác nhận',
  approved: 'Đã duyệt',
  delivering: 'Đang giao xe',
  renting: 'Đang thuê',
  returned: 'Đã trả xe',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const fmt = (d) =>
  d ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)) : '—';

const BookingManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState('');
  const [viewModal, setViewModal]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null);
  const [updating, setUpdating]       = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const filters = user?.showroom_id ? { showroom_id: user.showroom_id } : {};
      const data = await bookingService.getListBookings(filters);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu đặt xe.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (bookingId, newStatus) => {
    setUpdating(bookingId);
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      setBookings(prev => prev.map(b => (b._id || b.id) === bookingId ? { ...b, status: newStatus } : b));
      setViewModal(prev => prev && (prev._id || prev.id) === bookingId ? { ...prev, status: newStatus } : prev);
    } catch {
      // silent — refetch on failure
      fetchBookings();
    } finally {
      setUpdating('');
    }
  };

  const approve = (id) => updateStatus(id, 'approved');
  const reject  = (id) => updateStatus(id, 'cancelled');
  const advance = (b) => {
    const id  = b._id || b.id;
    const idx = BOOKING_FLOW.indexOf(b.status);
    if (idx >= 0 && idx < BOOKING_FLOW.length - 1) updateStatus(id, BOOKING_FLOW[idx + 1]);
  };

  const normalised = bookings.map(b => ({
    ...b,
    id:      b._id || b.id,
    renter:  b.renter_id?.full_name  || b.renter_id?.email || '—',
    vehicle: b.vehicle_id?.vehicle_name ||
             [b.vehicle_id?.vehicle_brand, b.vehicle_id?.vehicle_model].filter(Boolean).join(' ') || '—',
    from:    fmt(b.start_date),
    to:      fmt(b.end_date),
    days:    Math.max(1, Math.round((new Date(b.end_date) - new Date(b.start_date)) / 86400000)) || '—',
    total:   b.total_price || 0,
  }));

  const filtered = statusFilter === 'all' ? normalised : normalised.filter(b => b.status === statusFilter);

  const columns = [
    { key: 'id',      label: 'Mã đặt',     render: row => <span className="code-badge">{`BK${String(row.id).slice(-6).toUpperCase()}`}</span> },
    { key: 'renter',  label: 'Khách thuê',  accessor: 'renter', sortable: true },
    { key: 'vehicle', label: 'Xe',          render: row => <span style={{ fontSize: '0.8rem', maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.vehicle}</span> },
    { key: 'from',    label: 'Nhận xe',     accessor: 'from' },
    { key: 'to',      label: 'Trả xe',      accessor: 'to' },
    { key: 'days',    label: 'Ngày',        accessor: 'days', align: 'center' },
    { key: 'total',   label: 'Tổng tiền',   render: row => <span className="tabular-nums" style={{ fontWeight: 700, color: '#00b14f', whiteSpace: 'nowrap' }}>{Number(row.total).toLocaleString('vi-VN')}đ</span>, sortable: true, accessor: 'total' },
    { key: 'status',  label: 'Trạng thái',  render: row => <StatusBadge status={row.status} /> },
    { key: 'actions', label: 'Hành động',   render: row => {
      const isUpdating = updating === row.id;
      return (
        <div style={{ display: 'flex', gap: 5 }}>
          <button type="button" className="btn-icon" onClick={() => setViewModal(row)} title="Chi tiết" aria-label="Xem chi tiết đặt xe"><FaEye aria-hidden="true" /></button>
          {row.status === 'pending' && <>
            <button type="button" className="btn-icon" style={{ borderColor: '#059669', color: '#059669' }} onClick={() => approve(row.id)} disabled={isUpdating} title="Duyệt" aria-label="Phê duyệt">
              {isUpdating ? <FaSpinner aria-hidden="true" className="animate-spin" /> : <FaCheckCircle aria-hidden="true" />}
            </button>
            <button type="button" className="btn-icon danger" onClick={() => setRejectModal(row)} disabled={isUpdating} title="Từ chối" aria-label="Từ chối"><FaTimes aria-hidden="true" /></button>
          </>}
          {['approved', 'delivering', 'renting', 'returned'].includes(row.status) && (
            <button
              type="button"
              className="btn-icon"
              style={{ borderColor: '#2563eb', color: '#2563eb', fontSize: '0.72rem', whiteSpace: 'nowrap', padding: '5px 8px' }}
              onClick={() => advance(row)}
              disabled={isUpdating}
              aria-label={`Chuyển sang: ${FLOW_LABELS[BOOKING_FLOW[BOOKING_FLOW.indexOf(row.status) + 1]]}`}
            >
              {isUpdating ? <FaSpinner aria-hidden="true" className="animate-spin" /> : <FaArrowRight aria-hidden="true" />}
            </button>
          )}
        </div>
      );
    }},
  ];

  const pendingCount = normalised.filter(b => b.status === 'pending').length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Quản lý đặt xe</h1>
          <p className="page-subtitle">Theo dõi và xử lý tất cả booking của showroom</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
            {pendingCount} booking chờ xác nhận
          </div>
        )}
      </div>

      {/* Booking Flow visual */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #f0f0f0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 600 }}>
          {BOOKING_FLOW.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: normalised.some(b => b.status === s) ? '#00b14f' : '#e5e7eb' }} />
                <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{FLOW_LABELS[s]}</span>
                <span className="tabular-nums" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827' }}>{normalised.filter(b => b.status === s).length}</span>
              </div>
              {i < BOOKING_FLOW.length - 1 && <div style={{ height: 1, background: '#e5e7eb', flex: 2 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'renting', 'completed', 'cancelled'].map(s => (
          <button
            type="button"
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '5px 12px', borderRadius: 50, border: '1.5px solid',
              borderColor: statusFilter === s ? '#00b14f' : '#e5e7eb',
              background: statusFilter === s ? '#00b14f' : '#fff',
              color: statusFilter === s ? '#fff' : '#374151',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {s === 'all' ? 'Tất cả' : FLOW_LABELS[s] || s}
            {s !== 'all' && <span className="tabular-nums" style={{ marginLeft: 5, opacity: 0.7 }}>({normalised.filter(b => b.status === s).length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <FaSpinner aria-hidden="true" className="animate-spin text-primary text-xl" />
          <span>Đang tải dữ liệu…</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{loadError}</div>
      ) : (
        <DataTable columns={columns} data={filtered} searchPlaceholder="Tìm theo tên khách, xe…" />
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Chi tiết đặt xe" width={500}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="code-badge">{`BK${String(viewModal.id).slice(-6).toUpperCase()}`}</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginTop: 6 }}>{viewModal.vehicle}</div>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            {[
              ['Khách thuê', viewModal.renter],
              ['Thời gian nhận', viewModal.from],
              ['Thời gian trả', viewModal.to],
              ['Số ngày', viewModal.days],
              ['Tổng tiền', Number(viewModal.total).toLocaleString('vi-VN') + 'đ'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              {viewModal.status === 'pending' && <>
                <button type="button" className="btn-danger" style={{ flex: 1 }} onClick={() => { reject(viewModal.id); setViewModal(null); }}>Từ chối</button>
                <button type="button" className="btn-success" style={{ flex: 1 }} onClick={() => { approve(viewModal.id); setViewModal(null); }}>Phê duyệt</button>
              </>}
              {['approved', 'delivering', 'renting', 'returned'].includes(viewModal.status) && (
                <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => { advance(viewModal); setViewModal(null); }}>
                  Chuyển sang: {FLOW_LABELS[BOOKING_FLOW[BOOKING_FLOW.indexOf(viewModal.status) + 1]]} <FaArrowRight aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject confirm */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Xác nhận từ chối đặt xe"
        width={420}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setRejectModal(null)}>Hủy bỏ</button>
            <button type="button" className="btn-danger" onClick={() => { reject(rejectModal._id || rejectModal.id); setRejectModal(null); }}>Xác nhận từ chối</button>
          </>
        }
      >
        {rejectModal && (
          <p style={{ fontSize: '0.85rem', color: '#374151' }}>
            Bạn đang từ chối booking của khách hàng <b>{rejectModal.renter}</b>. Hành động này không thể hoàn tác.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;
