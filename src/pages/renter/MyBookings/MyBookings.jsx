import React, { useEffect, useMemo, useState } from 'react';
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
  { key: 'all', label: 'Tat ca' },
  { key: 'upcoming', label: 'Sap toi' },
  { key: 'active', label: 'Dang thue' },
  { key: 'completed', label: 'Hoan thanh' },
  { key: 'cancelled', label: 'Da huy' },
];

const UPCOMING_STATUSES = ['pending', 'confirmed', 'waiting_payment', 'paid', 'waiting_handover'];
const ACTIVE_STATUSES = ['handed_over', 'in_use', 'waiting_return_confirmation'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'waiting_payment'];
const RENTAL_FLOW_STATUSES = ['waiting_handover', 'handed_over', 'in_use', 'waiting_return_confirmation', 'completed'];

const PAYMENT_LABELS = {
  pending: 'Cho thanh toan',
  successful: 'Thanh cong',
  declined: 'Bi tu choi',
  failed: 'That bai',
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const getDurationDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / 86400000));
};

const getLocationLabel = (note) => {
  const rawNote = String(note || '').trim();
  if (!rawNote) return 'Tu den lay';
  return rawNote;
};

const matchTab = (booking, tabKey) => {
  if (tabKey === 'all') return true;
  if (tabKey === 'upcoming') return UPCOMING_STATUSES.includes(booking.status);
  if (tabKey === 'active') return ACTIVE_STATUSES.includes(booking.status);
  if (tabKey === 'completed') return booking.status === 'completed';
  if (tabKey === 'cancelled') return booking.status === 'cancelled';
  return false;
};

const mapBooking = (booking) => {
  const images = sanitizeImageList([
    ...(booking.vehicle_id?.vehicle_images_paths || []),
    ...(booking.vehicle_id?.images || []),
  ]);

  return {
    id: booking._id,
    vehicleName: booking.vehicle_id?.vehicle_name || 'Xe khong ten',
    showroomName: booking.showroom_id?.name || 'SmartRent',
    showroomEmail: booking.showroom_id?.email || '',
    startDate: booking.start_date,
    endDate: booking.end_date,
    durationDays: getDurationDays(booking.start_date, booking.end_date),
    locationLabel: getLocationLabel(booking.note),
    status: booking.status,
    totalPrice: booking.total_price,
    note: booking.note || '',
    image: images[0] || '',
    paymentStatus: booking.payment?.payment_status || 'pending',
    paymentMethod: booking.payment?.payment_method || 'Chua co',
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

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookingsDetailed();
      setBookings((data || []).map(mapBooking));
      setError('');
    } catch (err) {
      setBookings([]);
      setError(err.message || 'Khong the tai danh sach booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const displayedBookings = useMemo(
    () => bookings.filter((booking) => matchTab(booking, activeTab)),
    [activeTab, bookings]
  );

  const summary = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => UPCOMING_STATUSES.includes(booking.status)).length,
      active: bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).length,
      completed: bookings.filter((booking) => booking.status === 'completed').length,
    }),
    [bookings]
  );

  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm(`Huy booking ${booking.id} cho xe ${booking.vehicleName}?`);
    if (!confirmed) return;

    setCancellingId(booking.id);
    try {
      await bookingService.cancelBooking(booking.id);
      await loadBookings();
      if (detailModal?.id === booking.id) {
        setDetailModal(null);
      }
    } catch (err) {
      setError(err.message || 'Khong the huy booking nay.');
    } finally {
      setCancellingId('');
    }
  };

  const handleWorkflowSaved = (savedWorkflow) => {
    if (!rentalModalBooking?.id) {
      return;
    }

    setBookings((current) =>
      current.map((booking) =>
        booking.id === rentalModalBooking.id
          ? { ...booking, workflow: savedWorkflow }
          : booking
      )
    );

    setDetailModal((current) => (
      current && current.id === rentalModalBooking.id
        ? { ...current, workflow: savedWorkflow }
        : current
    ));
  };

  const getPaymentResultUrl = (booking) =>
    `/renter/payment-result?bookingId=${booking.id}&status=${
      booking.paymentStatus === 'successful'
        ? 'success'
        : booking.paymentStatus === 'pending'
          ? 'pending'
          : 'error'
    }`;

  const renderEmptyState = () => (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', background: '#fff', borderRadius: 14 }}>
      <MdDirectionsCar style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.3 }} />
      <div>Khong co booking nao trong nhom nay</div>
    </div>
  );

  return (
    <div className="my-bookings">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Chuyen di cua toi</h1>
          <p className="page-subtitle">Du lieu booking va thanh toan duoc nap truc tiep tu backend</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/')}>+ Dat xe moi</button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '12px 14px', fontSize: '0.84rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tong chuyen', val: summary.total, color: '#374151' },
          { label: 'Sap toi', val: summary.pending, color: '#d97706' },
          { label: 'Dang thue', val: summary.active, color: '#2563eb' },
          { label: 'Hoan thanh', val: summary.completed, color: '#059669' },
        ].map((item) => (
          <div key={item.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 18px', border: '1px solid #f0f0f0', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="booking-tabs">
        {TAB_CONFIG.map((tab) => {
          const count = tab.key === 'all'
            ? bookings.length
            : bookings.filter((booking) => matchTab(booking, tab.key)).length;

          return (
            <button
              key={tab.key}
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
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Dang tai du lieu...</div>
        ) : displayedBookings.length === 0 ? (
          renderEmptyState()
        ) : (
          displayedBookings.map((booking) => (
            <div key={booking.id} className="booking-card-item">
              <div className="booking-card-left">
                <div className="booking-card-img" style={{ overflow: 'hidden', background: '#f3f4f6' }}>
                  {booking.image ? (
                    <img src={booking.image} alt={booking.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#00b14f', marginTop: 8 }}>{formatMoney(booking.totalPrice)}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Ma: {booking.id}</div>
                  {(booking.workflow.receiveImages.length > 0 || booking.workflow.returnImages.length > 0) && (
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>
                      FE proof: {booking.workflow.receiveImages.length} anh nhan xe, {booking.workflow.returnImages.length} anh tra xe
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn-icon" onClick={() => setDetailModal(booking)} title="Chi tiet">
                    <FaEye />
                  </button>

                  {booking.showroomEmail && (
                    <a className="btn-icon" href={`mailto:${booking.showroomEmail}`} title="Lien he showroom">
                      <FaEnvelope />
                    </a>
                  )}

                  {ACTIVE_STATUSES.includes(booking.status) && (
                    <button
                      style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => navigate('/renter/sos')}
                    >
                      Bao cao su co
                    </button>
                  )}

                  {booking.canOpenRentalFlow && (
                    <button
                      style={{ background: '#00b14f', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setRentalModalBooking(booking)}
                    >
                      Nhan / Tra xe
                    </button>
                  )}

                  {booking.canCancel && (
                    <button
                      style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: cancellingId === booking.id ? 'wait' : 'pointer', opacity: cancellingId === booking.id ? 0.65 : 1 }}
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Dang huy...' : 'Huy booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiet booking" width={520}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{detailModal.vehicleName}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{detailModal.showroomName}</div>
            </div>

            {[
              ['Ma booking', detailModal.id],
              ['Ngay nhan xe', formatDateTime(detailModal.startDate)],
              ['Ngay tra xe', formatDateTime(detailModal.endDate)],
              ['So ngay thue', `${detailModal.durationDays} ngay`],
              ['Tong tien', formatMoney(detailModal.totalPrice)],
              ['Trang thai booking', detailModal.status],
              ['Trang thai thanh toan', PAYMENT_LABELS[detailModal.paymentStatus] || detailModal.paymentStatus],
              ['Phuong thuc thanh toan', detailModal.paymentMethod],
              ['Ghi chu / nhan xe', detailModal.locationLabel],
              ['Anh nhan xe (FE)', detailModal.workflow?.receiveImages?.length || 0],
              ['Anh tra xe (FE)', detailModal.workflow?.returnImages?.length || 0],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(getPaymentResultUrl(detailModal))}>
                <FaMoneyBillWave /> Xem ket qua thanh toan
              </button>

              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate('/renter/transactions')}
              >
                <FaExchangeAlt /> Lich su giao dich
              </button>

              {detailModal.canOpenRentalFlow && (
                <button
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setRentalModalBooking(detailModal)}
                >
                  <FaCamera /> Quy trinh nhan/tra
                </button>
              )}

              {detailModal.canCancel && (
                <button
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleCancelBooking(detailModal)}
                >
                  <FaTimesCircle /> Huy booking
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
