import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaCalendarAlt, FaMapMarkerAlt, FaChevronRight, FaCreditCard } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';
import bookingService from '../../../services/bookingService';

const STATUS_LABEL = {
  pending: { text: 'Chờ xác nhận', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { text: 'Đã xác nhận', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  waiting_payment: { text: 'Chờ thanh toán', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  paid: { text: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  active: { text: 'Đang thuê', cls: 'bg-green-50 text-green-700 border-green-200' },
  in_use: { text: 'Đang sử dụng', cls: 'bg-green-50 text-green-700 border-green-200' },
  waiting_handover: { text: 'Chờ bàn giao', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  handed_over: { text: 'Đã bàn giao', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  waiting_return_confirmation: { text: 'Chờ xác nhận trả', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  completed: { text: 'Hoàn thành', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { text: 'Đã hủy', cls: 'bg-red-50 text-red-600 border-red-200' },
};

const PAYABLE_STATUSES = ['pending', 'confirmed', 'waiting_payment'];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
};

const BookingCard = ({ booking, onClick, onPay }) => {
  const status = STATUS_LABEL[booking.status] || { text: booking.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  const canPay = PAYABLE_STATUSES.includes(booking.status);

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] p-5">
      <button
        className="w-full text-left flex gap-4 items-start"
        onClick={onClick}
        aria-label={`Xem chi tiết booking`}
      >
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          {booking.vehicle?.image_url ? (
            <img src={booking.vehicle.image_url} alt="" className="w-full h-full object-cover" aria-hidden="true" />
          ) : (
            <FaCar className="text-gray-300 text-2xl" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-gray-900 text-[0.95rem] truncate">
              {booking.vehicle?.brand} {booking.vehicle?.model || booking.vehicle?.vehicle_model || 'Xe không xác định'}
            </span>
            <FaChevronRight className="text-gray-300 shrink-0" size={13} aria-hidden="true" />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <FaCalendarAlt aria-hidden="true" />
              {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
            </span>
            {booking.vehicle?.location && (
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt aria-hidden="true" />
                {booking.vehicle.location}
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

      {canPay && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-[0.875rem] rounded-xl transition-colors shadow-sm"
            onClick={(e) => { e.stopPropagation(); onPay(booking); }}
          >
            <FaCreditCard size={14} aria-hidden="true" /> Thanh toán ngay
          </button>
        </div>
      )}
    </div>
  );
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await bookingService.getListBookings({ user_id: user._id || user.id });
        if (!cancelled) {
          const list = result?.data ?? result ?? [];
          setBookings(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải dữ liệu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBookings();
    return () => { cancelled = true; };
  }, [user]);

  const handlePay = (booking) => {
    navigate(`/renter/checkout?bookingId=${booking._id}`);
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
              key={booking._id}
              booking={booking}
              onClick={() => navigate(`/renter/bookings/${booking._id}`)}
              onPay={handlePay}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
