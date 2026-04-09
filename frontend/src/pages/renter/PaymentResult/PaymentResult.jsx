import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaHome, FaList, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import paymentService from '../../../services/paymentService';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentIntentId = searchParams.get('payment_intent');

  const [loading, setLoading] = useState(!!paymentIntentId);
  const [result, setResult] = useState(null);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (!paymentIntentId) {
      setLoading(false);
      return;
    }

    paymentService.syncIntent(paymentIntentId)
      .then((data) => setResult(data))
      .catch((err) => setSyncError(err.message || 'Không thể xác nhận kết quả thanh toán.'))
      .finally(() => setLoading(false));
  }, [paymentIntentId]);

  const intentStatus = result?.intentStatus;
  const isSuccess = intentStatus === 'succeeded';
  const isProcessing = intentStatus === 'processing';
  const isFailed = !isSuccess && !isProcessing;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16 }}>
        <FaSpinner style={{ fontSize: '2.5rem', color: '#87ceeb', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>Đang xác nhận kết quả thanh toán…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #f0f0f0' }}>

        {syncError ? (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaTimesCircle style={{ fontSize: '3rem', color: '#dc2626' }} aria-hidden="true" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Không thể xác nhận</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>{syncError}</p>
          </>
        ) : isSuccess ? (
          <>
            <div
              style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn 0.4s ease' }}
            >
              <FaCheckCircle style={{ fontSize: '3rem', color: '#059669' }} aria-hidden="true" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toán thành công!</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Đặt xe của bạn đã được xác nhận. Chúng tôi sẽ gửi thông tin chi tiết qua email và SMS.
            </p>
            {result && (
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
                {[
                  ['Mã giao dịch', result.intentId ? result.intentId.slice(-12).toUpperCase() : '—'],
                  ['Trạng thái Stripe', result.intentStatus || '—'],
                  ['Trạng thái thanh toán', result.paymentStatus || '—'],
                  ['Trạng thái đặt xe', result.bookingStatus || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                    <span style={{ color: '#9ca3af' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: '#111827' }} className="tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : isProcessing ? (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaInfoCircle style={{ fontSize: '3rem', color: '#0284c7' }} aria-hidden="true" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Đang xử lý</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Giao dịch đang được xử lý. Chúng tôi sẽ thông báo kết quả sớm nhất.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaTimesCircle style={{ fontSize: '3rem', color: '#dc2626' }} aria-hidden="true" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toán thất bại</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Giao dịch không thể thực hiện. Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <FaHome aria-hidden="true" /> Trang chủ
          </button>
          {(isSuccess || isProcessing) ? (
            <button
              type="button"
              onClick={() => navigate('/renter/bookings')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#00b14f', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <FaList aria-hidden="true" /> Xem chuyến đi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#00b14f', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  );
};

export default PaymentResult;
