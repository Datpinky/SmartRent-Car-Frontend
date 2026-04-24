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
  FaRobot,
  FaStar,
  FaTimesCircle,
} from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import bookingService from '../../../services/bookingService';
import reviewService from '../../../services/reviewService';
import { getCancelBookingNotice } from '../../../utils/bookingCancellationFeedback';
import { getBookingFlowState } from '../../../utils/bookingFlowState';
import {
  PAYMENT_LABELS,
  formatDateTime,
  formatMoney,
  mapRenterBooking,
} from '../../../utils/renterBookingView';
import RentalFlowModal from './RentalFlowModal';

const TAB_CONFIG = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang thuê' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const getReviewUserId = (review) => {
  const reviewUser = review?.user;
  if (!reviewUser) return '';
  if (typeof reviewUser === 'string') return reviewUser;
  return reviewUser._id || reviewUser.id || '';
};

const matchTab = (booking, tabKey) => {
  if (tabKey === 'all') return !booking.isCancelled && !booking.isAwaitingPickup;
  if (tabKey === 'active') return booking.isActive;
  if (tabKey === 'completed') return booking.isCompleted;
  if (tabKey === 'cancelled') return booking.isCancelled;
  return false;
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ tone: '', text: '' });
  const [detailModal, setDetailModal] = useState(null);
  const [cancellingId, setCancellingId] = useState('');
  const [rentalModalBooking, setRentalModalBooking] = useState(null);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState('');

  const currentUserId = user?._id || user?.id || '';

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookingsDetailed();
      setBookings((data || []).map(mapRenterBooking));
      setError('');
    } catch (err) {
      setBookings([]);
      setError(err.message || 'Không thể tải chuyến đi của bạn.');
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
      total: bookings.filter((booking) => !booking.isCancelled && !booking.isAwaitingPickup).length,
      awaitingPickup: bookings.filter((booking) => booking.isAwaitingPickup).length,
      active: bookings.filter((booking) => booking.isActive).length,
      completed: bookings.filter((booking) => booking.isCompleted).length,
    }),
    [bookings]
  );

  const applyBookingUpdate = (booking, nextStatus, nextWorkflow) => {
    if (!booking) {
      return booking;
    }

    const updatedStatus = nextStatus || booking.status;
    const updatedRaw = booking.raw
      ? { ...booking.raw, status: updatedStatus }
      : booking.raw;
    const nextFlowState = getBookingFlowState(
      {
        ...booking,
        raw: updatedRaw,
        status: updatedStatus,
      },
      booking.paymentStatus
    );

    return {
      ...booking,
      raw: updatedRaw,
      status: updatedStatus,
      workflow: nextWorkflow || booking.workflow,
      hasAiInspectionReport: Boolean((nextWorkflow || booking.workflow)?.aiInspection?.result),
      canConfirmPickup: nextFlowState.canConfirmPickup,
      canOpenRentalFlow: nextFlowState.canOpenRentalFlow,
      canReportIssue: nextFlowState.isActive,
      hasRentalEnded: nextFlowState.hasEnded,
      hasRentalStarted: nextFlowState.hasStarted,
      isActive: nextFlowState.isActive,
      isAwaitingPickup: nextFlowState.isAwaitingPickup,
      isCancelled: nextFlowState.isCancelled,
      isCompleted: nextFlowState.isCompleted,
      isUpcoming: nextFlowState.isUpcoming,
      pickupConfirmationHint: nextFlowState.pickupConfirmationHint,
      rentalAccessHint: nextFlowState.rentalAccessHint,
      rentalActionLabel: nextFlowState.rentalActionLabel || booking.rentalActionLabel,
    };
  };

  const handleCancelBooking = async (booking) => {
    const cancelMessage = booking.paymentStatus === 'successful'
      ? `Hủy booking ${booking.id} cho xe ${booking.vehicleName}? Hệ thống sẽ chạy luồng hoàn tiền theo logic backend nếu booking đã thanh toán.`
      : `Hủy booking ${booking.id} cho xe ${booking.vehicleName}?`;
    const confirmed = window.confirm(cancelMessage);
    if (!confirmed) return;

    setCancellingId(booking.id);
    setError('');
    setNotice({ tone: '', text: '' });
    try {
      const cancelResult = await bookingService.cancelBooking(booking.id);
      await loadBookings();
      if (detailModal?.id === booking.id) {
        setDetailModal(null);
      }
      setNotice(getCancelBookingNotice(booking, cancelResult));
    } catch (err) {
      setError(err.message || 'Không thể hủy booking này.');
    } finally {
      setCancellingId('');
    }
  };

  const handleWorkflowSaved = (payload) => {
    const targetId = rentalModalBooking?.id;
    if (!targetId) {
      return;
    }

    const nextWorkflow = payload?.workflow || payload;
    const nextStatus = payload?.status || '';

    const applyByTarget = (booking) => (
      booking && booking.id === targetId
        ? applyBookingUpdate(booking, nextStatus, nextWorkflow)
        : booking
    );

    setBookings((current) => current.map((booking) => applyByTarget(booking)));
    setDetailModal((current) => (current ? applyByTarget(current) : current));
    setRentalModalBooking((current) => (current ? applyByTarget(current) : current));
  };

  const resetReviewState = () => {
    setReviewForm({ rating: 5, comment: '' });
    setReviewError('');
    setReviewLoading(false);
    setReviewSubmitting(false);
    setEditingReviewId('');
  };

  const handleCloseReviewModal = () => {
    setReviewModalBooking(null);
    resetReviewState();
  };

  const handleOpenReview = async (booking) => {
    if (!booking?.vehicleId) {
      setError('Không tìm thấy thông tin xe để mở form đánh giá.');
      return;
    }

    setDetailModal(null);
    setReviewModalBooking(booking);
    setReviewForm({ rating: 5, comment: '' });
    setReviewError('');
    setEditingReviewId('');
    setReviewLoading(true);

    try {
      const res = await reviewService.getByVehicleId(booking.vehicleId, { page: 1, limit: 100 });
      const ownReview = (res?.data || []).find((review) => getReviewUserId(review) === currentUserId);

      if (ownReview) {
        setEditingReviewId(ownReview._id || '');
        setReviewForm({
          rating: Number(ownReview.rating) || 5,
          comment: ownReview.comment || '',
        });
      }
    } catch (err) {
      setReviewError(err.message || 'Không thể tải dữ liệu đánh giá lúc này.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!reviewModalBooking?.vehicleId) {
      setReviewError('Không tìm thấy thông tin xe để gửi đánh giá.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');

    try {
      if (editingReviewId) {
        await reviewService.update({
          review_id: editingReviewId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      } else {
        await reviewService.create({
          vehicle_id: reviewModalBooking.vehicleId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      }

      handleCloseReviewModal();
    } catch (err) {
      setReviewError(err.message || 'Không thể gửi đánh giá lúc này.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getPaymentResultUrl = (booking) =>
    `/renter/payment-result?bookingId=${booking.id}&status=${booking.paymentStatus === 'successful'
      ? 'success'
      : booking.paymentStatus === 'pending'
        ? 'pending'
        : 'error'
    }`;

  const renderEmptyState = () => (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 20px',
        color: '#9ca3af',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #f1f5f9',
      }}
    >
      <MdDirectionsCar style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.3 }} />
      <div style={{ fontWeight: 700, color: '#6b7280', marginBottom: summary.awaitingPickup > 0 ? 10 : 0 }}>
        {summary.awaitingPickup > 0
          ? 'Bạn chưa có chuyến đi nào sau khi nhận xe.'
          : 'Không tìm thấy booking trong mục này.'}
      </div>
      {summary.awaitingPickup > 0 && (
        <button className="btn-primary" onClick={() => navigate('/renter/pending-pickups')}>
          Mở khu chờ nhận xe
        </button>
      )}
    </div>
  );

  return (
    <div className="my-bookings">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Chuyến đi của tôi</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/')}>Hành trình mới</button>
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng chuyến', val: summary.total, color: '#374151' },
          { label: 'Chờ nhận xe', val: summary.awaitingPickup, color: '#d97706' },
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
              minWidth: 110,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {summary.awaitingPickup > 0 && (
        <div
          style={{
            marginBottom: 18,
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.84rem', lineHeight: 1.6 }}>
            Bạn có {summary.awaitingPickup} booking đang chờ xác nhận đã nhận xe. Chỉ sau khi renter
            xác nhận nhận xe, booking mới hiện trong "Chuyến đi của tôi".
          </div>
          <button className="btn-primary" onClick={() => navigate('/renter/pending-pickups')}>
            Mở khu chờ nhận xe
          </button>
        </div>
      )}

      <div className="booking-tabs">
        {TAB_CONFIG.map((tab) => {
          const count = bookings.filter((booking) => matchTab(booking, tab.key)).length;
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
                  {(booking.workflow?.receiveImages?.length > 0 || booking.workflow?.returnImages?.length > 0) && (
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>
                      FE proof: {booking.workflow?.receiveImages?.length || 0} ảnh nhận xe, {booking.workflow?.returnImages?.length || 0} ảnh trả xe
                    </div>
                  )}
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

                  {booking.canReportIssue && (
                    <button
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
                      {booking.rentalActionLabel}
                    </button>
                  )}

                  {booking.hasAiInspectionReport && (
                    <button
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/renter/ai-reports?bookingId=${booking.id}`)}
                    >
                      Thiệt hại phát sinh
                    </button>
                  )}

                  {booking.canReviewVehicle && (
                    <button
                      style={{
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleOpenReview(booking)}
                    >
                      Đánh giá xe
                    </button>
                  )}

                  {booking.canCancel && (
                    <button
                      className="renter-btn-soft-danger"
                      style={{ opacity: cancellingId === booking.id ? 0.65 : 1 }}
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
              ['Thiệt hại phát sinh', detailModal.hasAiInspectionReport ? 'Đã có báo cáo' : 'Chưa tạo'],
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

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate(getPaymentResultUrl(detailModal))}
              >
                <FaMoneyBillWave /> Xem kết quả thanh toán
              </button>

              <button
                className="renter-btn-soft"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigate('/renter/transactions')}
              >
                <FaExchangeAlt /> Lịch sử giao dịch
              </button>

              {detailModal.canOpenRentalFlow && (
                <button
                  className="renter-btn-soft"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setRentalModalBooking(detailModal)}
                >
                  <FaCamera /> {detailModal.rentalActionLabel}
                </button>
              )}

              {detailModal.canReviewVehicle && (
                <button
                  className="renter-btn-soft"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleOpenReview(detailModal)}
                >
                  <FaCamera /> Đánh giá xe
                </button>
              )}

              {detailModal.hasAiInspectionReport && (
                <button
                  className="renter-btn-soft"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => navigate(`/renter/ai-reports?bookingId=${detailModal.id}`)}
                >
                  <FaRobot /> Thiệt hại phát sinh
                </button>
              )}

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

      <Modal
        isOpen={!!reviewModalBooking}
        onClose={handleCloseReviewModal}
        title={editingReviewId ? 'Chỉnh sửa đánh giá xe' : 'Đánh giá xe'}
        width={560}
      >
        {reviewModalBooking && (
          <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f9fafb', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{reviewModalBooking.vehicleName}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>{reviewModalBooking.showroomName}</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 8 }}>
                {formatDateTime(reviewModalBooking.startDate)} - {formatDateTime(reviewModalBooking.endDate)}
              </div>
            </div>

            {reviewLoading ? (
              <div style={{ textAlign: 'center', padding: '18px 0', color: '#6b7280', fontSize: '0.84rem' }}>
                Đang tải dữ liệu đánh giá...
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: editingReviewId ? '#eff6ff' : '#f0fdf4',
                    border: editingReviewId ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                    color: editingReviewId ? '#1d4ed8' : '#166534',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                  }}
                >
                  {editingReviewId
                    ? 'Bạn đang chỉnh sửa đánh giá đã gửi trước đó cho chiếc xe này.'
                    : 'Hãy chia sẻ trải nghiệm thuê xe để showroom và renter khác tham khảo.'}
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Số sao</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm((current) => ({ ...current, rating: star }))}
                        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                      >
                        <FaStar size={24} color={star <= reviewForm.rating ? '#f59e0b' : '#d1d5db'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Nhận xét</div>
                  <textarea
                    rows={5}
                    maxLength={1000}
                    value={reviewForm.comment}
                    onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                    placeholder="Viết cảm nhận của bạn về chất lượng xe, tình trạng sạch sẽ, thái độ hỗ trợ..."
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: 12,
                      padding: '12px 14px',
                      fontSize: '0.84rem',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: '0.74rem', color: '#9ca3af', textAlign: 'right' }}>
                    {reviewForm.comment.length}/1000
                  </div>
                </div>

                {reviewError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: 12,
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                    }}
                  >
                    {reviewError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="renter-btn-soft"
                    onClick={handleCloseReviewModal}
                    style={{ justifyContent: 'center' }}
                  >
                    Dong
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={reviewSubmitting}
                    style={{ justifyContent: 'center', opacity: reviewSubmitting ? 0.7 : 1 }}
                  >
                    {reviewSubmitting
                      ? (editingReviewId ? 'Đang lưu...' : 'Đang gửi...')
                      : (editingReviewId ? 'Lưu thay đổi' : 'Gửi đánh giá')}
                  </button>
                </div>
              </>
            )}
          </form>
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
