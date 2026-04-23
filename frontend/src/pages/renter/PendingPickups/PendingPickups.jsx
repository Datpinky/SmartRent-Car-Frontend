import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaEye,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaSpinner,
  FaTimesCircle,
} from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import bookingService from '../../../services/bookingService';
import { getCancelBookingNotice } from '../../../utils/bookingCancellationFeedback';
import {
  PAYMENT_LABELS,
  formatDateTime,
  formatMoney,
  mapRenterBooking,
} from '../../../utils/renterBookingView';

const PendingPickups = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ tone: '', text: '' });
  const [detailModal, setDetailModal] = useState(null);
  const [confirmingId, setConfirmingId] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookingsDetailed();
      const mapped = (data || []).map(mapRenterBooking).filter((booking) => booking.isAwaitingPickup);
      setBookings(mapped);
      setError('');
    } catch (err) {
      setBookings([]);
      setError(err.message || 'Không thể tải danh sách chờ nhận xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const summary = useMemo(
    () => ({
      total: bookings.length,
      ready: bookings.filter((booking) => booking.canConfirmPickup).length,
      paid: bookings.filter((booking) => booking.paymentStatus === 'successful').length,
      unpaid: bookings.filter((booking) => booking.paymentStatus !== 'successful').length,
    }),
    [bookings]
  );

  const getPaymentResultUrl = (booking) =>
    `/renter/payment-result?bookingId=${booking.id}&status=${booking.paymentStatus === 'successful'
      ? 'success'
      : booking.paymentStatus === 'pending'
        ? 'pending'
        : 'error'
    }`;

  const handleConfirmPickup = async (booking) => {
    const confirmed = window.confirm(
      `Xác nhận bạn đã nhận xe ${booking.vehicleName}? Sau khi xác nhận, booking sẽ được chuyển vào "Chuyến đi của tôi".`
    );
    if (!confirmed) return;

    setConfirmingId(booking.id);
    setError('');
    setNotice({ tone: '', text: '' });

    try {
      await bookingService.updateBookingStatus(booking.id, 'handed_over');
      setDetailModal(null);
      await loadBookings();
      setNotice({
        tone: 'success',
        text: `Đã xác nhận nhận xe cho ${booking.vehicleName}. Booking này đã được chuyển vào "Chuyến đi của tôi".`,
      });
    } catch (err) {
      setError(err.message || 'Không thể xác nhận nhận xe lúc này.');
    } finally {
      setConfirmingId('');
    }
  };

  const handleCancelBooking = async (booking) => {
    const message = booking.paymentStatus === 'successful'
      ? `Hủy booking ${booking.id} cho xe ${booking.vehicleName}? Hệ thống sẽ chạy luồng hoàn tiền theo logic backend nếu booking đã thanh toán.`
      : `Hủy booking ${booking.id} cho xe ${booking.vehicleName}?`;
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    setCancellingId(booking.id);
    setError('');
    setNotice({ tone: '', text: '' });

    try {
      const cancelResult = await bookingService.cancelBooking(booking.id);
      setDetailModal(null);
      await loadBookings();
      setNotice(getCancelBookingNotice(booking, cancelResult));
    } catch (err) {
      setError(err.message || 'Không thể hủy booking lúc này.');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="pending-pickups">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Chờ nhận xe</h1>
          <p className="page-subtitle">Booking mới sẽ vào đây cho đến khi bạn xác nhận đã nhận xe hoặc hủy booking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="renter-btn-soft" onClick={() => navigate('/renter/bookings')}>
            Chuyến đi của tôi
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>Đặt xe mới</button>
        </div>
      </div>

      {notice.text && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: '0.84rem',
            lineHeight: 1.6,
            background: notice.tone === 'warning' ? '#fff7ed' : '#f0fdf4',
            border: notice.tone === 'warning' ? '1px solid #fdba74' : '1px solid #86efac',
            color: notice.tone === 'warning' ? '#9a3412' : '#166534',
          }}
        >
          {notice.text}
        </div>
      )}

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
          { label: 'Tổng booking', val: summary.total, color: '#374151' },
          { label: 'Có thể xác nhận', val: summary.ready, color: '#059669' },
          { label: 'Đã thanh toán', val: summary.paid, color: '#2563eb' },
          { label: 'Cần theo dõi thêm', val: summary.unpaid, color: '#d97706' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: '10px 18px',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #16a34a 100%)',
          borderRadius: 22,
          padding: 22,
          color: '#fff',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.14)',
              padding: '7px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            <FaCheckCircle />
            Xác nhận nhận xe trước khi bắt đầu chuyến đi
          </div>
          <div style={{ fontSize: '1.28rem', fontWeight: 800, lineHeight: 1.35, marginBottom: 8 }}>
            Booking sẽ nằm ở khu này cho đến khi bạn xác nhận đã nhận xe.
          </div>
          <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.86)' }}>
            Nếu bạn đã nhận xe từ showroom, bấm "Xác nhận đã nhận xe" để đưa booking vào "Chuyến đi của tôi".
            Nếu thay đổi kế hoạch, bạn có thể hủy booking ngay tại đây.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <FaSpinner className="animate-spin" style={{ fontSize: '1.4rem', marginBottom: 10 }} />
          <div>Đang tải danh sách chờ nhận xe...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid #f1f5f9',
            padding: 30,
            textAlign: 'center',
          }}
        >
          <MdDirectionsCar style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: 14 }} />
          <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>Không có booking nào đang chờ nhận xe</div>
          <div style={{ fontSize: '0.84rem', color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
            Sau khi thanh toán booking thành công, booking sẽ được đưa vào đây cho đến khi bạn xác nhận đã nhận xe.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="renter-btn-soft" onClick={() => navigate('/renter/bookings')}>
              Mở Chuyến đi của tôi
            </button>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Đặt xe mới
            </button>
          </div>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaCalendarAlt size={11} /> {formatDateTime(booking.startDate)} - {formatDateTime(booking.endDate)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaClock size={11} /> {booking.durationDays} ngày
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaMapMarkerAlt size={11} /> {booking.locationLabel}
                    </span>
                  </div>
                  {booking.pickupConfirmationHint && (
                    <div style={{ marginTop: 8, fontSize: '0.76rem', color: '#9a3412', lineHeight: 1.6 }}>
                      {booking.pickupConfirmationHint}
                    </div>
                  )}
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
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn-icon" onClick={() => setDetailModal(booking)} title="Chi tiết">
                    <FaEye />
                  </button>

                  {booking.showroomEmail && (
                    <a className="btn-icon" href={`mailto:${booking.showroomEmail}`} title="Liên hệ showroom">
                      <FaEnvelope />
                    </a>
                  )}

                  <button
                    style={{
                      background: booking.canConfirmPickup ? '#00b14f' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: booking.canConfirmPickup ? 'pointer' : 'not-allowed',
                      opacity: confirmingId === booking.id ? 0.7 : 1,
                    }}
                    disabled={!booking.canConfirmPickup || confirmingId === booking.id}
                    onClick={() => handleConfirmPickup(booking)}
                  >
                    {confirmingId === booking.id ? 'Đang xác nhận...' : 'Xác nhận đã nhận xe'}
                  </button>

                  {booking.canCancel && (
                    <button
                      className="renter-btn-soft-danger"
                      style={{ opacity: cancellingId === booking.id ? 0.65 : 1 }}
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Đang hủy...' : 'Hủy booking / hoàn tiền'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiết chờ nhận xe" width={560}>
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
              ['Tổng tiền', formatMoney(detailModal.totalPrice)],
              ['Trạng thái booking', detailModal.status],
              ['Trạng thái thanh toán', PAYMENT_LABELS[detailModal.paymentStatus] || detailModal.paymentStatus],
              ['Phương thức thanh toán', detailModal.paymentMethod],
              ['Ghi chú / nhận xe', detailModal.locationLabel],
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
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            {detailModal.pickupConfirmationHint && (
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fdba74',
                  color: '#9a3412',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                }}
              >
                {detailModal.pickupConfirmationHint}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate(getPaymentResultUrl(detailModal))}
              >
                <FaMoneyBillWave /> Xem kết quả thanh toán
              </button>

              <button
                className="renter-btn-soft-success"
                style={{ flex: 1, justifyContent: 'center', opacity: detailModal.canConfirmPickup ? 1 : 0.6 }}
                onClick={() => handleConfirmPickup(detailModal)}
                disabled={!detailModal.canConfirmPickup || confirmingId === detailModal.id}
              >
                <FaCheckCircle /> Xác nhận đã nhận xe
              </button>

              {detailModal.canCancel && (
                <button
                  className="renter-btn-soft-danger"
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
    </div>
  );
};

export default PendingPickups;
