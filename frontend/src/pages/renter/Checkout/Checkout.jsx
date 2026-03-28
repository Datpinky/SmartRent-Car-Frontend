import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt, FaUniversity, FaCheckCircle, FaTag, FaArrowRight } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { cars } from '../../../components/data/cars';

const PAYMENT_METHODS = [
  { id: 'wallet',  label: 'Ví điện tử', sub: 'MoMo, ZaloPay, VNPay', icon: <FaMobileAlt /> },
  { id: 'card',    label: 'Thẻ tín dụng/ghi nợ', sub: 'Visa, Mastercard, JCB', icon: <FaCreditCard /> },
  { id: 'transfer',label: 'Chuyển khoản ngân hàng', sub: 'ATM nội địa', icon: <FaUniversity /> },
];

const VOUCHERS = [
  { code: 'SMART10', discount: 10, label: 'Giảm 10% cho đơn đầu tiên' },
  { code: 'MEMBER50', discount: 0, label: 'Giảm 50K cho thành viên', fixed: 50000 },
];

const Checkout = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const car = cars.find(c => c.id === Number(carId)) || cars[0];

  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState('wallet');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [pickupDate, setPickupDate] = useState('2026-03-15T10:00');
  const [returnDate, setReturnDate] = useState('2026-03-17T10:00');
  const [deliveryType, setDeliveryType] = useState('pickup');

  const days = Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000));
  const subtotal = car.price * 1000 * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const voucherDiscount = appliedVoucher ? (appliedVoucher.fixed || Math.round(subtotal * appliedVoucher.discount / 100)) : 0;
  const total = subtotal + serviceFee - voucherDiscount;

  const applyVoucher = () => {
    const found = VOUCHERS.find(v => v.code === voucherCode.toUpperCase());
    if (found) { setAppliedVoucher(found); setVoucherError(''); }
    else { setVoucherError('Mã giảm giá không hợp lệ'); }
  };

  const handleOrder = () => { setStep(3); setTimeout(() => navigate('/renter/payment-result?status=success'), 2000); };

  const hue = Math.abs((car.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;

  return (
    <div className="checkout-page">
      {/* Steps indicator */}
      <div className="checkout-steps">
        {['Xác nhận đặt xe', 'Thanh toán', 'Hoàn tất'].map((label, i) => (
          <React.Fragment key={label}>
            <div className={`checkout-step ${step >= i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <div className="checkout-step-num">{step > i + 1 ? <FaCheckCircle /> : i + 1}</div>
              <span>{label}</span>
            </div>
            {i < 2 && <div className={`checkout-step-line ${step > i + 1 ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="checkout-layout">
        {/* Left panel */}
        <div className="checkout-main">
          {step === 1 && (
            <div className="checkout-card">
              <h3 className="checkout-section">Thông tin đặt xe</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, background: '#f9fafb', borderRadius: 12, padding: 14 }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, background: `hsl(${hue},20%,92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MdDirectionsCar style={{ fontSize: '2.2rem', color: car.color || '#00b14f' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{car.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{car.showroom || 'Showroom SmartRent'} · {car.location}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00b14f', marginTop: 4 }}>{car.price}K/ngày</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="checkout-label">Thời gian nhận xe</label>
                  <input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="checkout-input" />
                </div>
                <div>
                  <label className="checkout-label">Thời gian trả xe</label>
                  <input type="datetime-local" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="checkout-input" />
                </div>
              </div>

              <div>
                <label className="checkout-label">Hình thức nhận xe</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[['pickup', 'Tự đến lấy'], ['delivery', 'Giao tận nơi']].map(([val, label]) => (
                    <button key={val} onClick={() => setDeliveryType(val)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${deliveryType === val ? '#00b14f' : '#e5e7eb'}`, background: deliveryType === val ? '#f0fdf4' : '#fff', color: deliveryType === val ? '#00b14f' : '#374151', fontWeight: deliveryType === val ? 700 : 500, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="checkout-btn-next" onClick={() => setStep(2)}>Tiếp tục <FaArrowRight /></button>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-card">
              <h3 className="checkout-section">Phương thức thanh toán</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {PAYMENT_METHODS.map(m => (
                  <div key={m.id} onClick={() => setPayMethod(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: `2px solid ${payMethod === m.id ? '#00b14f' : '#e5e7eb'}`, background: payMethod === m.id ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#374151', flexShrink: 0 }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{m.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.sub}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${payMethod === m.id ? '#00b14f' : '#d1d5db'}`, background: payMethod === m.id ? '#00b14f' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {payMethod === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher */}
              <div style={{ marginBottom: 16 }}>
                <label className="checkout-label"><FaTag style={{ marginRight: 4 }} /> Mã giảm giá</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Nhập mã voucher" className="checkout-input" style={{ flex: 1 }} />
                  <button onClick={applyVoucher} style={{ padding: '9px 16px', background: '#00b14f', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>Áp dụng</button>
                </div>
                {voucherError && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4 }}>{voucherError}</div>}
                {appliedVoucher && <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4 }}>✓ {appliedVoucher.label}</div>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="checkout-btn-back" onClick={() => setStep(1)}>← Quay lại</button>
                <button className="checkout-btn-next" onClick={handleOrder}>Xác nhận thanh toán</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem', color: '#00b14f', animation: 'spin 0.6s ease' }}>
                <FaCheckCircle />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: 8 }}>Đang xử lý thanh toán...</div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Vui lòng không đóng trang này</p>
              <style>{`@keyframes spin { from { transform: scale(0.5) rotate(-90deg); opacity: 0 } to { transform: scale(1) rotate(0deg); opacity: 1 } }`}</style>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h3 className="checkout-section">Tóm tắt đơn hàng</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [`${car.price}K × ${days} ngày`, subtotal.toLocaleString() + 'đ', false],
              ['Phí dịch vụ (5%)', serviceFee.toLocaleString() + 'đ', false],
              appliedVoucher ? ['Giảm giá', '−' + voucherDiscount.toLocaleString() + 'đ', true] : null,
            ].filter(Boolean).map(([label, val, isDiscount]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: isDiscount ? '#059669' : '#6b7280' }}>
                <span>{label}</span><span style={{ fontWeight: 600, color: isDiscount ? '#059669' : '#374151' }}>{val}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
              <span>Tổng cộng</span>
              <span style={{ color: '#00b14f' }}>{total.toLocaleString()}đ</span>
            </div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12, marginTop: 14, fontSize: '0.78rem', color: '#374151' }}>
            ✓ Miễn phí hủy trước 1 giờ · Thanh toán an toàn · Bảo hiểm toàn diện
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
