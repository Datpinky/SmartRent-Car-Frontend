import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaHome, FaList } from 'react-icons/fa';

const PaymentResult = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status') || 'success';
  const isSuccess = status === 'success';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #f0f0f0' }}>
        {isSuccess ? (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn 0.4s ease' }}>
              <FaCheckCircle style={{ fontSize: '3rem', color: '#0284c7' }} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toán thành công!</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Đặt xe của bạn đã được xác nhận. Chúng tôi sẽ gửi thông tin chi tiết qua email và SMS.
            </p>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              {[['Mã đặt xe', 'BK' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')], ['Thời gian', '15/03/2026 10:00 – 17/03/2026 10:00'], ['Tổng tiền', '2.520.000đ']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                  <span style={{ color: '#9ca3af' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaTimesCircle style={{ fontSize: '3rem', color: '#dc2626' }} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', marginBottom: 8 }}>Thanh toán thất bại</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>Giao dịch không thể thực hiện. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            <FaHome /> Trang chủ
          </button>
          {isSuccess
            ? <button onClick={() => navigate('/renter/bookings')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#87ceeb', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                <FaList /> Xem chuyến đi
              </button>
            : <button onClick={() => navigate(-1)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', background: '#87ceeb', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                Thử lại
              </button>
          }
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  );
};

export default PaymentResult;