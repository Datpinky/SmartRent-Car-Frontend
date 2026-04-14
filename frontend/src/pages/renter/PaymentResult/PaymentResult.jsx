import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FaCheckCircle, FaTimesCircle, FaSpinner,
  FaCalendarAlt, FaCar, FaReceipt,
} from 'react-icons/fa';
import bookingService from '../../../services/bookingService';
import paymentService from '../../../services/paymentService';

const fmt = (d) =>
  d ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '—';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentIntentId = searchParams.get('payment_intent');
  const bookingId       = searchParams.get('booking_id');
  const demoMode        = searchParams.get('demo') === '1';
  const redirectStatus  = searchParams.get('redirect_status'); // 'succeeded' | 'requires_payment_method'

  const [status, setStatus]   = useState('loading'); // 'loading' | 'success' | 'failed'
  const [booking, setBooking] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Demo mode: không có Stripe key thật
        if (demoMode) {
          if (bookingId) {
            try {
              const b = await bookingService.getBookingById(bookingId);
              if (!cancelled) setBooking(b);
            } catch { /* optional */ }
          }
          if (!cancelled) setStatus('success');
          return;
        }

        // Nếu Stripe gửi redirect_status = failed
        if (redirectStatus && redirectStatus !== 'succeeded') {
          if (!cancelled) { setStatus('failed'); setError('Thanh toán không thành công. Vui lòng thử lại.'); }
          return;
        }

        // Sync intent với backend để cập nhật trạng thái booking
        if (paymentIntentId) {
          await paymentService.syncIntent(paymentIntentId);
        }

        // Fetch thông tin booking để hiển thị
        if (bookingId) {
          const b = await bookingService.getBookingById(bookingId);
          if (!cancelled) setBooking(b);
        }

        if (!cancelled) setStatus('success');
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.');
          setStatus('failed');
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [paymentIntentId, bookingId, demoMode, redirectStatus]);

  const bookingCode = booking?._id
    ? `BK${booking._id.toString().slice(-6).toUpperCase()}`
    : bookingId
    ? `BK${bookingId.slice(-6).toUpperCase()}`
    : '—';

  const totalPrice = booking?.total_price
    ? booking.total_price.toLocaleString('vi-VN') + 'đ'
    : '—';

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <FaSpinner aria-hidden="true" className="text-primary text-4xl animate-spin" />
        <p className="text-gray-600 text-sm">Đang xác nhận thanh toán…</p>
      </div>
    );
  }

  // ─── Failed ────────────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-md w-full text-center">
          <FaTimesCircle aria-hidden="true" className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'Giao dịch không được hoàn tất. Vui lòng thử lại.'}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="btn-primary w-full justify-center"
              onClick={() => navigate(-1)}
            >
              Thử lại
            </button>
            <Link to="/" className="btn-outline w-full text-center">Về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5 py-10">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-md w-full text-center">
        {/* Icon + Title */}
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle aria-hidden="true" className="text-green-500 text-3xl" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Đặt xe thành công!</h1>
        <p className="text-gray-500 text-sm mb-6">Cảm ơn bạn đã đặt xe tại SmartRent Car.</p>

        {/* Booking info */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm">
            <FaReceipt aria-hidden="true" className="text-primary shrink-0" />
            <div>
              <div className="text-xs text-gray-400">Mã đơn đặt xe</div>
              <div className="font-bold text-gray-900 tabular-nums">{bookingCode}</div>
            </div>
          </div>
          {booking?.start_date && (
            <div className="flex items-center gap-3 text-sm">
              <FaCalendarAlt aria-hidden="true" className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Nhận xe</div>
                <div className="font-medium text-gray-800">{fmt(booking.start_date)}</div>
              </div>
            </div>
          )}
          {booking?.end_date && (
            <div className="flex items-center gap-3 text-sm">
              <FaCalendarAlt aria-hidden="true" className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Trả xe</div>
                <div className="font-medium text-gray-800">{fmt(booking.end_date)}</div>
              </div>
            </div>
          )}
          {booking?.vehicle_id && (
            <div className="flex items-center gap-3 text-sm">
              <FaCar aria-hidden="true" className="text-primary shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Xe</div>
                <div className="font-medium text-gray-800">
                  {booking.vehicle_id?.vehicle_name ||
                   [booking.vehicle_id?.vehicle_brand, booking.vehicle_id?.vehicle_model].filter(Boolean).join(' ') ||
                   'Xe đặt thuê'}
                </div>
              </div>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-sm">
            <span>Tổng thanh toán</span>
            <span className="text-primary tabular-nums">{totalPrice}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/renter/bookings"
            className="btn-primary w-full text-center justify-center"
          >
            Xem lịch sử đặt xe
          </Link>
          <Link to="/" className="btn-outline w-full text-center justify-center">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
