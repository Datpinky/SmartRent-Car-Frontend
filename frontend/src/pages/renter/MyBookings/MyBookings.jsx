import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaCamera,
  FaClock,
  FaEnvelope,
  FaExchangeAlt,
  FaEye,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaTimesCircle,
} from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import bookingService from '../../../services/bookingService';
import RentalFlowModal from './RentalFlowModal';
import { sanitizeImageList } from '../../../utils/media';
import { getRentalWorkflow } from '../../../utils/rentalWorkflowStorage';

const TAB_CONFIG = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'active', label: 'Đang thuê' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const UPCOMING_STATUSES = ['pending', 'confirmed', 'waiting_payment', 'paid', 'waiting_handover'];
const ACTIVE_STATUSES = ['handed_over', 'in_use', 'waiting_return_confirmation'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'waiting_payment'];
const RENTAL_FLOW_STATUSES = ['waiting_handover', 'handed_over', 'in_use', 'waiting_return_confirmation', 'completed'];

const PAYMENT_LABELS = {
  pending: 'Chờ thanh toán',
  successful: 'Thành công',
  declined: 'Bị từ chối',
  failed: 'Thất bại',
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const getDurationDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / 86400000));
};

const getLocationLabel = (note) => {
  const rawNote = String(note || '').trim();
  if (!rawNote) return 'Tự đến lấy';
  return rawNote;
};

const matchTab = (booking, tabKey) => {
  if (tabKey === 'all') return booking.status !== 'cancelled';
  if (tabKey === 'upcoming') return UPCOMING_STATUSES.includes(booking.status);
  if (tabKey === 'active') return ACTIVE_STATUSES.includes(booking.status);
  if (tabKey === 'completed') return booking.status === 'completed';
  if (tabKey === 'cancelled') return booking.status === 'cancelled';
  return false;
};

const mapBooking = (booking) => {
  const images = sanitizeImageList([
    ...(booking.vehicle?.images || []),
    ...(booking.vehicle_id?.vehicle_images_paths || []),
    ...(booking.vehicle_id?.images || []),
  ]);

  const paymentStatus =
    booking.payment?.payment_status ||
    booking.paymentState?.paymentStatus ||
    (booking.status === 'paid' ? 'successful' : 'pending');

  return {
    id: booking._id,
    vehicleName: booking.vehicle?.name || booking.vehicle_id?.vehicle_name || 'Xe không tên',
    showroomName: booking.showroom?.name || booking.showroom_id?.name || 'SmartRent',
    showroomEmail: booking.showroom?.email || booking.showroom_id?.email || '',
    startDate: booking.start_date,
    endDate: booking.end_date,
    durationDays: getDurationDays(booking.start_date, booking.end_date),
    locationLabel: getLocationLabel(booking.note),
    status: booking.status,
    totalPrice: booking.total_price,
    note: booking.note || '',
    image: images[0] || '',
    paymentStatus,
    paymentMethod: booking.payment?.payment_method || 'Chưa có',
    paymentRecord: booking.payment || null,
    canCancel: CANCELLABLE_STATUSES.includes(booking.status),
    canOpenRentalFlow: RENTAL_FLOW_STATUSES.includes(booking.status),
    workflow: getRentalWorkflow(booking._id),
    raw: booking,
  };
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [cancellingId, setCancellingId] = useState('');
  const [rentalModalBooking, setRentalModalBooking] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookingsDetailed();
      setBookings((data || []).map(mapBooking));
      setError('');
    } catch (err) {
      setBookings([]);
      setError(err.response?.data?.message || err.message || 'Không thể tải lịch sử Booking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const displayedBookings = useMemo(
    () => bookings.filter((booking) => matchTab(booking, activeTab)),
    [activeTab, bookings]
  );

  const summary = useMemo(
    () => ({
      total: bookings.filter((booking) => booking.status !== 'cancelled').length,
      pending: bookings.filter((booking) => UPCOMING_STATUSES.includes(booking.status)).length,
      active: bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).length,
      completed: bookings.filter((booking) => booking.status === 'completed').length,
    }),
    [bookings]
  );

  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm(`Hủy booking ${booking.id} cho xe ${booking.vehicleName}?`);
    if (!confirmed) return;

    setCancellingId(booking.id);
    try {
      await bookingService.cancelBooking(booking.id);
      await loadBookings();
      if (detailModal?.id === booking.id) {
        setDetailModal(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể hủy booking này');
    } finally {
      setCancellingId('');
    }
  };

  const handleWorkflowSaved = (savedWorkflow) => {
    if (!rentalModalBooking?.id) {
      return;
    }

    setBookings((current) =>
      current.map((b) => (b.id === rentalModalBooking.id ? { ...b, workflow: savedWorkflow } : b))
    );

    setDetailModal((current) =>
      current && current.id === rentalModalBooking.id ? { ...current, workflow: savedWorkflow } : current
    );
  };

  const getPaymentResultUrl = (booking) =>
    `/renter/payment-result?bookingId=${booking.id}&status=${
      booking.paymentStatus === 'successful' ? 'success' : booking.paymentStatus === 'pending' ? 'pending' : 'error'
    }`;

  const renderEmptyState = () => (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 0',
        color: '#9ca3af',
        background: '#fff',
        borderRadius: 14,
      }}
    >
      <MdDirectionsCar style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.3 }} />
      <div>Không tìm thấy booking</div>
    </div>
  );

  return (
    <div className="my-bookings">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Chuyến đi của tôi</h1>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          Hành trình mới
        </button>
      </div>
      {error && (
        <div
          style={{
            marginBottom: 16,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: '0.84rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng chuyến', val: summary.total, color: '#374151' },
          { label: 'Sắp tới', val: summary.pending, color: '#d97706' },
          { label: 'Đang thuê', val: summary.active, color: '#2563eb' },
          { label: 'Hoàn thành', val: summary.completed, color: '#059669' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: '10px 18px',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              minWidth: 100,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="booking-tabs">
        {TAB_CONFIG.map((tab) => {
          const count = bookings.filter((b) => matchTab(b, tab.key)).length;

          return (
            <button
              key={tab.key}
              type="button"
              className={`booking-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {count > 0 && <span className="booking-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="booking-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Đang tải dữ liệu...</div>
        ) : displayedBookings.length === 0 ? (
          renderEmptyState()
        ) : (
          displayedBookings.map((booking) => (
            <div key={booking.id} className="booking-card-item">
              <div className="booking-card-left">
                <div className="booking-card-img" style={{ overflow: 'hidden', background: '#f3f4f6' }}>
                  {booking.image ? (
                    <img
                      src={booking.image}
                      alt={booking.vehicleName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <MdDirectionsCar style={{ fontSize: '2.5rem', color: '#00b14f' }} />
                  )}
                </div>
                <div className="booking-card-info">
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{booking.vehicleName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>{booking.showroomName}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                        color: '#6b7280',
                      }}
                    >
                      <FaCalendarAlt size={11} /> {formatDateTime(booking.startDate)} - {formatDateTime(booking.endDate)}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                        color: '#6b7280',
                      }}
                    >
                      <FaClock size={11} /> {booking.durationDays} ngày
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                        color: '#6b7280',
                      }}
                    >
                      <FaMapMarkerAlt size={11} /> {booking.locationLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-card-right">
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={booking.status} />
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge
                      status={booking.paymentStatus}
                      customLabel={PAYMENT_LABELS[booking.paymentStatus] || booking.paymentStatus}
                    />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#00b14f', marginTop: 8 }}>
                    {formatMoney(booking.totalPrice)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Mã: {booking.id}</div>
                  {(booking.workflow.receiveImages.length > 0 || booking.workflow.returnImages.length > 0) && (
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>
                      Đã lưu: {booking.workflow.receiveImages.length} ảnh nhận xe, {booking.workflow.returnImages.length}{' '}
                      ảnh trả xe
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-icon" onClick={() => setDetailModal(booking)} title="Chi tiết">
                    <FaEye />
                  </button>

                  {booking.showroomEmail && (
                    <a className="btn-icon" href={`mailto:${booking.showroomEmail}`} title="Liên hệ showroom">
                      <FaEnvelope />
                    </a>
                  )}

                  {ACTIVE_STATUSES.includes(booking.status) && (
                    <button
                      type="button"
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate('/renter/sos')}
                    >
                      Báo cáo sự cố
                    </button>
                  )}

                  {booking.canOpenRentalFlow && (
                    <button
                      type="button"
                      style={{
                        background: '#00b14f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => setRentalModalBooking(booking)}
                    >
                      Nhận / Trả xe
                    </button>
                  )}

                  {booking.canCancel && (
                    <button
                      type="button"
                      style={{
                        background: '#111827',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: cancellingId === booking.id ? 'wait' : 'pointer',
                        opacity: cancellingId === booking.id ? 0.65 : 1,
                      }}
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Đang hủy...' : 'Hủy booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiết" width={520}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{detailModal.vehicleName}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{detailModal.showroomName}</div>
            </div>

            {[
              ['Mã booking', detailModal.id],
              ['Ngày nhận xe', formatDateTime(detailModal.startDate)],
              ['Ngày trả xe', formatDateTime(detailModal.endDate)],
              ['Số ngày thuê', `${detailModal.durationDays} ngày`],
              ['Tổng tiền', formatMoney(detailModal.totalPrice)],
              ['Trạng thái booking', detailModal.status],
              ['Trạng thái thanh toán', PAYMENT_LABELS[detailModal.paymentStatus] || detailModal.paymentStatus],
              ['Phương thức thanh toán', detailModal.paymentMethod],
              ['Ghi chú / nhận xe', detailModal.locationLabel],
              ['Ảnh nhận xe (FE)', detailModal.workflow?.receiveImages?.length || 0],
              ['Ảnh trả xe (FE)', detailModal.workflow?.returnImages?.length || 0],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderBottom: '1px solid #f3f4f6',
                  paddingBottom: 10,
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', textAlign: 'right' }}>
                  {value}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate(getPaymentResultUrl(detailModal))}
              >
                <FaMoneyBillWave /> Xem kết quả thanh toán
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate('/renter/transactions')}
              >
                <FaExchangeAlt /> Lịch sử giao dịch
              </button>

              {detailModal.canOpenRentalFlow && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setRentalModalBooking(detailModal)}
                >
                  <FaCamera /> Quy trình nhận / trả
                </button>
              )}

              {detailModal.canCancel && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleCancelBooking(detailModal)}
                >
                  <FaTimesCircle /> Hủy booking
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <RentalFlowModal
        isOpen={!!rentalModalBooking}
        onClose={() => setRentalModalBooking(null)}
        booking={rentalModalBooking}
        onSaved={handleWorkflowSaved}
      />
    </div>
  );
};

export default MyBookings;
