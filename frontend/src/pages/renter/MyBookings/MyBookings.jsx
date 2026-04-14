import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaCalendarAlt, FaMapMarkerAlt, FaChevronRight, FaSpinner } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import bookingService from '../../../services/bookingService';
import Modal from '../../../components/common/Modal';
import { BOOKING_STATUS_LABELS } from '../../../constants/bookingStatus';
import { formatVnd } from '../../../utils/currencyFormat';

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  waiting_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  waiting_handover: 'bg-sky-50 text-sky-800 border-sky-200',
  handed_over: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  in_use: 'bg-green-50 text-green-800 border-green-200',
  waiting_return_confirmation: 'bg-orange-50 text-orange-800 border-orange-200',
};

const renterStatusDisplay = (status) => {
  const text = BOOKING_STATUS_LABELS[status] || status;
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  return { text, cls };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount) => formatVnd(amount);

const BookingCard = ({ booking, onClick }) => {
  const status = renterStatusDisplay(booking.status);
  return (
    <button
      type="button"
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] p-5 flex gap-4 items-start"
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {(booking.vehicle_id?.vehicle_images_paths?.[0] || booking.vehicle?.image_url) ? (
          <img
            src={booking.vehicle_id?.vehicle_images_paths?.[0] || booking.vehicle?.image_url}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <FaCar className="text-gray-300 text-2xl" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-bold text-gray-900 text-[0.95rem] truncate">
            {booking.vehicle_id?.vehicle_name ||
             [booking.vehicle_id?.vehicle_brand, booking.vehicle_id?.vehicle_model].filter(Boolean).join(' ') ||
             (booking.vehicle?.brand && booking.vehicle?.model ? `${booking.vehicle.brand} ${booking.vehicle.model}` : '') ||
             'Xe không xác định'}
          </span>
          <FaChevronRight className="text-gray-300 shrink-0" size={13} aria-hidden="true" />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <FaCalendarAlt aria-hidden="true" />
            {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
          </span>
          {(booking.vehicle_id?.address || booking.vehicle?.location) && (
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt aria-hidden="true" />
              {booking.vehicle_id?.address || booking.vehicle?.location}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[0.75rem] font-semibold ${status.cls}`}>
            {status.text}
          </span>
          <span className="font-bold text-gray-900 text-[0.9rem]">{formatCurrency(booking.total_price)}</span>
        </div>
      </div>
    </button>
  );
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await bookingService.getListBookings({ limit: 100, page: 1 });
      setBookings(items);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const canCancel = (b) =>
    b && ['pending', 'confirmed', 'waiting_payment'].includes(b.status);

  const handleCancel = async () => {
    if (!detail?._id && !detail?.id) return;
    const id = detail._id || detail.id;
    setCancelling(true);
    try {
      await bookingService.updateBookingStatus(id, 'cancelled');
      setBookings((prev) => prev.map((x) => ((x._id || x.id) === id ? { ...x, status: 'cancelled' } : x)));
      setDetail((d) => (d ? { ...d, status: 'cancelled' } : null));
    } catch {
      fetchBookings();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Chuyến đi của tôi</h1>
        <p className="text-[0.875rem] text-gray-500 mt-1">Lịch sử và trạng thái các chuyến thuê xe của bạn</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400">Đang tải chuyến đi…</span>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[0.875rem]" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
            <MdDirectionsCar className="text-gray-300 text-4xl" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Chưa có chuyến đi nào</p>
            <p className="text-[0.85rem] text-gray-400">Hãy tìm và đặt xe để bắt đầu hành trình của bạn.</p>
          </div>
          <button
            type="button"
            className="mt-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-[0.875rem] hover:bg-primary-dark transition-colors"
            onClick={() => navigate('/')}
          >
            Tìm xe ngay
          </button>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking._id || booking.id}
              booking={booking}
              onClick={() => setDetail(booking)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Chi tiết chuyến đi" width={480}>
        {detail && (
          <div className="flex flex-col gap-3 text-[0.875rem]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500">Trạng thái</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[0.75rem] font-semibold ${renterStatusDisplay(detail.status).cls}`}>
                {renterStatusDisplay(detail.status).text}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nhận xe</span>
              <span className="font-medium text-gray-900">{formatDate(detail.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trả xe</span>
              <span className="font-medium text-gray-900">{formatDate(detail.end_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền</span>
              <span className="font-bold text-primary">{formatCurrency(detail.total_price)}</span>
            </div>
            {canCancel(detail) && (
              <button
                type="button"
                className="mt-2 w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-[0.85rem] hover:bg-red-50 flex items-center justify-center gap-2"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? <FaSpinner className="animate-spin" aria-hidden="true" /> : null}
                Hủy đặt xe
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookings;
