import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaSpinner,
} from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import bookingService from '../../../services/bookingService';
import {
  PAYMENT_LABELS,
  formatDateTime,
  formatMoney,
  mapRenterBooking,
} from '../../../utils/renterBookingView';

const cardInfoStyle = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #f1f5f9',
  padding: 18,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
};

const PendingPickups = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlightedBookingId = params.get('bookingId') || '';
  const handledHighlightRef = useRef('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getCurrentRoleBookingsDetailed();
      const mapped = (data || [])
        .map(mapRenterBooking)
        .filter((booking) => booking.isAwaitingPickup);
      setBookings(mapped);
      setError('');
    } catch (err) {
      setBookings([]);
      setError(err.message || 'Khong the tai danh sach cho nhan xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (!highlightedBookingId || loading || bookings.length === 0) {
      return;
    }

    const handledKey = `${window.location.pathname}:${highlightedBookingId}`;
    if (handledHighlightRef.current === handledKey) {
      return;
    }

    const targetBooking = bookings.find((booking) => String(booking.id) === String(highlightedBookingId));
    if (!targetBooking) {
      return;
    }

    handledHighlightRef.current = handledKey;
    setDetailModal(targetBooking);
  }, [bookings, highlightedBookingId, loading]);

  const summary = useMemo(
    () => ({
      total: bookings.length,
      waiting: bookings.length,
      readyForHandover: bookings.filter((booking) => booking.status === 'waiting_handover').length,
      contactable: bookings.filter((booking) => Boolean(booking.showroomEmail)).length,
    }),
    [bookings]
  );

  const waitingLabel = 'Dang cho showroom hoan tat ban giao';

  return (
    <div className="pending-pickups">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Cho nhan xe</h1>
          <p className="page-subtitle">
            Theo doi cac booking da sang muc Cho ban giao. Hien backend van de showroom hoan tat buoc ban giao tren he thong.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="renter-btn-soft" onClick={() => navigate('/renter/pending-showroom-processing')}>
            Cho showroom xu ly
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Dat xe moi
          </button>
        </div>
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
          { label: 'Tong booking', val: summary.total, color: '#374151' },
          { label: 'Dang cho ban giao', val: summary.waiting, color: '#d97706' },
          { label: 'Da san sang giao', val: summary.readyForHandover, color: '#2563eb' },
          { label: 'Co email showroom', val: summary.contactable, color: '#059669' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              ...cardInfoStyle,
              minWidth: 150,
              textAlign: 'center',
              padding: '14px 18px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <FaSpinner className="animate-spin" style={{ fontSize: '1.4rem', marginBottom: 10 }} />
          <div>Dang tai danh sach cho nhan xe...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ ...cardInfoStyle, textAlign: 'center', padding: 30 }}>
          <MdDirectionsCar style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: 14 }} />
          <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>Khong co booking nao dang cho nhan xe</div>
          <div style={{ fontSize: '0.84rem', color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
            Booking se hien tai day khi showroom da chuyen sang Cho ban giao va dang hoan tat buoc giao xe tren he thong.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="renter-btn-soft" onClick={() => navigate('/renter/bookings')}>
              Mo Chuyen di cua toi
            </button>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Dat xe moi
            </button>
          </div>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="booking-card-item"
              onClick={() => setDetailModal(booking)}
              style={String(booking.id) === String(highlightedBookingId)
                ? {
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 12px 30px rgba(37, 99, 235, 0.12)',
                  background: '#f8fbff',
                  cursor: 'pointer',
                }
                : { cursor: 'pointer' }}
            >
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
                      <FaClock size={11} /> {booking.durationDays} ngay
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaMapMarkerAlt size={11} /> {booking.locationLabel}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>{booking.statusHeadline}</div>
                  <div style={{ marginTop: 4, fontSize: '0.76rem', color: '#6b7280', lineHeight: 1.6 }}>
                    {booking.waitingForLabel}
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
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Ma: {booking.id}</div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#e2e8f0',
                      color: '#475569',
                    }}
                  >
                    {waitingLabel}
                  </div>
                  {booking.showroomEmail && (
                    <a
                      className="renter-btn-soft"
                      href={`mailto:${booking.showroomEmail}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <FaEnvelope /> Lien he showroom
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiet cho nhan xe" width={560}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{detailModal.vehicleName}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{detailModal.showroomName}</div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 800, color: '#111827', marginBottom: 8 }}>{detailModal.statusHeadline}</div>
              <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.65, marginBottom: 8 }}>
                {detailModal.waitingForLabel}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 700, marginBottom: 6 }}>
                {detailModal.waitingOwnerLabel}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
                Buoc tiep theo: {detailModal.nextStepLabel}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#0f766e', lineHeight: 1.6 }}>
                Viec ban nen lam: {detailModal.renterActionHint}
              </div>
            </div>

            {[
              ['Ma booking', detailModal.id],
              ['Ngay nhan xe', formatDateTime(detailModal.startDate)],
              ['Ngay tra xe', formatDateTime(detailModal.endDate)],
              ['Tong tien', formatMoney(detailModal.totalPrice)],
              ['Trang thai booking', detailModal.status],
              ['Trang thai thanh toan', PAYMENT_LABELS[detailModal.paymentStatus] || detailModal.paymentStatus],
              ['Phuong thuc thanh toan', detailModal.paymentMethod],
              ['Dia diem giao nhan', detailModal.locationLabel],
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: '#e2e8f0',
                color: '#475569',
                padding: '12px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                minHeight: 42,
                textAlign: 'center',
              }}
            >
              {waitingLabel}
            </div>

            {detailModal.showroomEmail && (
              <a
                className="renter-btn-soft"
                href={`mailto:${detailModal.showroomEmail}`}
                style={{ justifyContent: 'center' }}
              >
                <FaEnvelope /> Lien he showroom de xac nhan ban giao
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingPickups;
