import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaCheckCircle,
  FaHome,
  FaList,
  FaMoneyBillWave,
  FaSpinner,
  FaTimesCircle,
} from 'react-icons/fa';
import bookingService from '../../../services/bookingService';

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString('vi-VN');
};

const PaymentResult = () => {
  const [params] = useSearchParams();
  const routeParams = useParams();
  const navigate = useNavigate();

  const bookingId = params.get('bookingId') || routeParams.bookingId || '';
  const [status, setStatus] = useState(params.get('status') || 'success');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  const isSuccess = status === 'success';
  const isPending = status === 'pending';

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);

        if (!bookingId) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const data = await bookingService.getBookingById(bookingId);
        if (!mounted) {
          return;
        }

        setBooking(data.booking || null);
        setPayment(data.payment || null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error('Payment result load error:', err);
        setStatus('error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <FaSpinner className="animate-spin" style={{ fontSize: '3rem', color: '#00b14f' }} />
        <p style={{ marginTop: 16, color: '#6b7280' }}>Dang tai thong tin giao dich...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #f0f0f0' }}>
        {isSuccess ? (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn 0.4s ease' }}>
              <FaCheckCircle style={{ fontSize: '3rem', color: '#059669' }} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toan thanh cong</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Booking cua ban da duoc xac nhan. Chi tiet payment ben duoi dang duoc doc truc tiep tu backend.
            </p>
          </>
        ) : isPending ? (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaSpinner className="animate-spin" style={{ fontSize: '2.4rem', color: '#d97706' }} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toan dang cho xu ly</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Backend da tao booking va payment record, nhung giao dich chua o trang thai thanh cong.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaTimesCircle style={{ fontSize: '3rem', color: '#dc2626' }} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toan that bai</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Giao dich khong the thuc hien hoac chua duoc ghi nhan thanh cong.
            </p>
          </>
        )}

        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
          {[
            ['Ma booking', bookingId || 'N/A'],
            ['Xe', booking?.vehicle_id?.vehicle_name || 'Dang tai...'],
            ['Thoi gian thue', booking ? `${formatDate(booking.start_date)} -> ${formatDate(booking.end_date)}` : 'N/A'],
            ['Tong tien', booking ? `${Number(booking.total_price || 0).toLocaleString('vi-VN')}d` : 'N/A'],
            ['Payment method', payment?.payment_method || 'Chua co'],
            ['Payment status', payment?.payment_status || 'pending'],
            ['Paid at', formatDate(payment?.paid_at)],
            ['Transaction code', payment?.transaction_code || payment?.stripe_payment_intent_id || 'Chua co'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, fontSize: '0.82rem' }}>
              <span style={{ color: '#9ca3af' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#111827', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <FaHome /> Trang chu
          </button>

          {isSuccess ? (
            <button
              onClick={() => navigate('/renter/bookings')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#00b14f', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <FaList /> Xem booking
            </button>
          ) : isPending ? (
            <button
              onClick={() => navigate('/renter/bookings')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#d97706', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <FaList /> Theo doi booking
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#00b14f', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Thu lai
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/renter/transactions')}
          style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#111827', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <FaMoneyBillWave /> Lich su giao dich
        </button>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  );
};

export default PaymentResult;
