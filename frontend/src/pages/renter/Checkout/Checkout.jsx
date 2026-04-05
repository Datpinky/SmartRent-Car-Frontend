import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt, FaUniversity, FaCheckCircle, FaTag, FaArrowRight, FaCalendarAlt, FaStar, FaChevronLeft, FaCarSide, FaUserFriends } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { cars } from '../../../components/data/cars';

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Ví điện tử', sub: 'MoMo, ZaloPay, VNPay', icon: <FaMobileAlt size={20} /> },
  { id: 'card', label: 'Thẻ tín dụng / Ghi nợ', sub: 'Visa, Mastercard, JCB', icon: <FaCreditCard size={20} /> },
  { id: 'transfer', label: 'Chuyển khoản ngân hàng', sub: 'ATM nội địa, quét QR', icon: <FaUniversity size={20} /> },
];

const VOUCHERS = [
  { code: 'SMART10', discount: 10, label: 'Giảm 10% cho đơn đầu tiên' },
  { code: 'MEMBER50', discount: 0, label: 'Giảm 50K cho thành viên', fixed: 50 },
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const days = Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000));
  const subtotal = car.price * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const voucherDiscount = appliedVoucher ? (appliedVoucher.fixed ? appliedVoucher.fixed : Math.round(subtotal * appliedVoucher.discount / 100)) : 0;
  const total = subtotal + serviceFee - voucherDiscount;

  const applyVoucher = () => {
    const found = VOUCHERS.find(v => v.code === voucherCode.toUpperCase());
    if (found) { setAppliedVoucher(found); setVoucherError(''); }
    else { setVoucherError('Mã giảm giá không hợp lệ'); setAppliedVoucher(null); }
  };

  const handleOrder = () => {
    setStep(3);
    setTimeout(() => navigate('/renter/payment-result?status=success'), 2000);
  };

  const hue = Math.abs((car.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  // deliveryType is kept in state for future use but displayed as read-only

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-5 font-[inherit]">
      <div className="max-w-[1100px] mx-auto">
        <button
          className="flex items-center gap-2 text-[0.85rem] text-slate-500 font-bold mb-6 hover:text-primary transition-colors cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <FaChevronLeft size={12} /> Quay lại
        </button>

        {/* Steps indicator */}
        <div className="flex items-center justify-center max-w-[600px] mx-auto mb-10 relative z-10">
          {['Xác nhận đặt xe', 'Thanh toán', 'Hoàn tất'].map((label, i) => {
            const isActive = step >= i + 1;
            const isDone = step > i + 1;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-2 relative z-10 w-[110px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[0.95rem] transition-all duration-300 shadow-sm
                    ${isActive ? (isDone ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-primary text-white shadow-[0_0_0_4px_rgba(135,206,235,0.2)]') : 'bg-slate-200 text-slate-500'}`}>
                    {isDone ? <FaCheckCircle size={18} /> : i + 1}
                  </div>
                  <span className={`text-[0.8rem] text-center font-bold sm:whitespace-nowrap ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-1 -mt-6 mx-2 rounded-full transition-colors duration-300 ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Main Content */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-8">
            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">Thông tin chuyến đi</h2>
                
                {/* Vehicle Mini-card */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 mb-6 overflow-hidden">
                  {/* Car Image */}
                  <div className="w-full h-48 relative overflow-hidden bg-slate-100">
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full items-center justify-center"
                      style={{ display: car.image ? 'none' : 'flex', background: `linear-gradient(135deg, hsl(${hue},30%,90%), hsl(${hue},30%,95%))` }}
                    >
                      <FaCarSide className="text-[4rem]" style={{ color: car.color || '#87ceeb' }} />
                    </div>
                    {/* Overlay badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[0.75rem] font-bold text-slate-600 shadow-sm">
                      {car.category}
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 px-2.5 py-1 rounded-lg text-[0.75rem] font-bold text-white shadow-sm">
                      <FaStar size={10} /> {car.rating}
                    </div>
                  </div>
                  {/* Car Info */}
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[1.05rem] text-slate-800">{car.name}</h3>
                      <div className="flex items-center gap-1.5 text-[0.8rem] text-slate-500 mt-1"><MdLocationOn size={14} className="text-slate-400"/> {car.address}</div>
                      <div className="flex items-center gap-1 text-[0.8rem] font-medium text-slate-500 mt-1">
                        <span className="text-slate-400">{car.trips} chuyến</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="font-bold text-primary">{car.price.toLocaleString()}K<span className="text-slate-400 font-normal">/ngày</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-[0.8rem] font-bold text-slate-600 mb-2 uppercase tracking-wide">Nhận xe</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-[0.9rem] font-medium text-slate-700 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-bold text-slate-600 mb-2 uppercase tracking-wide">Trả xe</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="datetime-local" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-[0.9rem] font-medium text-slate-700 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-[0.8rem] font-bold text-slate-600 mb-3 uppercase tracking-wide">Hình thức nhận xe</label>
                  {car.type === 'Gặp chủ xe' ? (
                    <div className="flex items-center gap-3 p-4 bg-violet-50 border-2 border-violet-400 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                        <FaUserFriends size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-[0.95rem] text-violet-700">Gặp chủ xe</div>
                        <div className="text-[0.75rem] text-slate-500 mt-0.5">Khách hàng gặp trực tiếp chủ xe để nhận xe</div>
                      </div>
                      <div className="ml-auto">
                        <FaCheckCircle size={18} className="text-violet-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-primary/5 border-2 border-primary rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FaCarSide size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-[0.95rem] text-primary">Tự nhận xe</div>
                        <div className="text-[0.75rem] text-slate-500 mt-0.5">Khách hàng tự đến địa điểm nhận xe</div>
                      </div>
                      <div className="ml-auto">
                        <FaCheckCircle size={18} className="text-primary" />
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => setStep(2)} className="w-full flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[1rem] rounded-xl shadow-[0_4px_14px_rgba(135,206,235,0.4)] hover:shadow-[0_6px_20px_rgba(135,206,235,0.5)] transition-all hover:-translate-y-px">
                  Tiếp tục thanh toán <FaArrowRight size={14} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6">Phương thức thanh toán</h2>
                
                <div className="flex flex-col gap-3 mb-8">
                  {PAYMENT_METHODS.map(m => (
                    <div key={m.id} onClick={() => setPayMethod(m.id)} className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${payMethod === m.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${payMethod === m.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>{m.icon}</div>
                      <div className="ml-4 flex-1">
                        <div className="font-bold text-[0.95rem] text-slate-800">{m.label}</div>
                        <div className="text-[0.8rem] text-slate-500 mt-0.5">{m.sub}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 ${payMethod === m.id ? 'border-primary' : 'border-slate-300'}`}>
                        {payMethod === m.id && <div className="w-2.5 h-2.5 bg-primary rounded-full transition-all" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
                  <label className="flex items-center gap-1.5 text-[0.85rem] font-bold text-slate-700 mb-3"><FaTag className="text-primary"/> Nhập mã khuyến mãi</label>
                  <div className="flex gap-2">
                    <input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Ví dụ: SMART10" className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-[0.9rem] uppercase focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
                    <button onClick={applyVoucher} className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-[0.9rem] rounded-xl transition-colors whitespace-nowrap shadow-md">Áp dụng</button>
                  </div>
                  {voucherError && <div className="text-[0.8rem] text-red-500 mt-2 font-bold">⚠ {voucherError}</div>}
                  {appliedVoucher && <div className="text-[0.8rem] text-emerald-600 mt-2 font-bold flex items-center gap-1.5"><FaCheckCircle /> Đã áp dụng: {appliedVoucher.label}</div>}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[1rem] rounded-xl transition-colors flex-[0.7] whitespace-nowrap">
                    Quay lại
                  </button>
                  <button onClick={handleOrder} className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[1rem] rounded-xl shadow-[0_4px_14px_rgba(135,206,235,0.4)] hover:shadow-[0_6px_20px_rgba(135,206,235,0.5)] transition-all hover:-translate-y-px">
                    Thanh toán {total.toLocaleString()}K
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10 animate-fade-in">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-[3rem] mb-6 relative">
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                  <FaCheckCircle className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Đang xử lý giao dịch</h2>
                <p className="text-slate-500 font-medium">Vui lòng không đóng trình duyệt trong quá trình này...</p>
              </div>
            )}
          </div>

          {/* Right Summary */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-8 lg:sticky lg:top-24">
            <h3 className="font-extrabold text-[1.1rem] text-slate-800 mb-5 pb-4 border-b border-slate-100">Chi tiết thanh toán</h3>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center text-[0.9rem]">
                <span className="text-slate-500 font-bold">Đơn giá thuê ({days} ngày)</span>
                <span className="font-bold text-slate-800">{subtotal.toLocaleString()}K</span>
              </div>
              <div className="flex justify-between items-center text-[0.9rem]">
                <span className="text-slate-500 font-bold">Phí dịch vụ <span className="text-[0.7rem] bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-600">5%</span></span>
                <span className="font-bold text-slate-800">{serviceFee.toLocaleString()}K</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between items-center text-[0.9rem] text-emerald-600">
                  <span className="font-bold">Khuyến mãi</span>
                  <span className="font-bold">-{voucherDiscount.toLocaleString()}K</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-end mb-6">
              <span className="font-extrabold text-[1.05rem] text-slate-800">Tổng thanh toán</span>
              <div className="text-right">
                <span className="block text-[1.6rem] font-black text-primary leading-none">{total.toLocaleString()}K</span>
                <span className="text-[0.75rem] text-slate-400 font-bold mt-1.5 block">Đã bao gồm VAT</span>
              </div>
            </div>

            <div className="bg-emerald-50 text-emerald-700 rounded-xl p-4 text-[0.8rem] font-bold border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2"><FaCheckCircle size={14} className="text-emerald-500"/> Hủy miễn phí trước 1h nhận xe</div>
              <div className="flex items-center gap-2"><FaCheckCircle size={14} className="text-emerald-500"/> Bảo hiểm chuyến đi toàn diện</div>
              <div className="flex items-center gap-2"><FaCheckCircle size={14} className="text-emerald-500"/> Thanh toán an toàn 100%</div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
      `}} />
    </div>
  );
};

export default Checkout;
