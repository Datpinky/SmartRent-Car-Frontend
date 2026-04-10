import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  FaCheckCircle, FaCalendarAlt, FaSpinner, FaExclamationCircle, FaTag,
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import vehicleService from '../../../services/vehicleService';
import bookingService from '../../../services/bookingService';
import paymentService from '../../../services/paymentService';

// ─── Stripe promise (singleton) ───────────────────────────────────────────────
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const defaultPickup = () => {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  return d.toISOString().slice(0, 16);
};
const defaultReturn = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  return d.toISOString().slice(0, 16);
};

// ─── Inner card form (must be inside <Elements>) ─────────────────────────────
const StripeCardForm = ({ onSuccess, onError, bookingId, processing, setProcessing }) => {
  const stripe   = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    onError('');

    const returnUrl = `${window.location.origin}/renter/payment-result?booking_id=${bookingId}`;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      onError(error.message || 'Thanh toán thất bại. Vui lòng thử lại.');
      setProcessing(false);
    }
    // Nếu không lỗi → Stripe tự redirect về return_url
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Thông tin thẻ Stripe
        </label>
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <PaymentElement
            options={{
              layout: 'tabs',
              wallets: { applePay: 'never', googlePay: 'never' },
            }}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {processing
          ? <><FaSpinner aria-hidden="true" className="animate-spin" /> Đang xử lý…</>
          : 'Thanh toán ngay'}
      </button>
    </form>
  );
};

// ─── Main Checkout page ───────────────────────────────────────────────────────
const Checkout = () => {
  const { carId }  = useParams();
  const navigate   = useNavigate();

  const [step, setStep]               = useState(1);
  const [vehicle, setVehicle]         = useState(null);
  const [loadingVehicle, setLoadVeh]  = useState(true);
  const [vehicleError, setVehError]   = useState('');

  const [pickupDate, setPickupDate]   = useState(defaultPickup);
  const [returnDate, setReturnDate]   = useState(defaultReturn);

  // Payment state
  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId]       = useState('');
  const [preparingPay, setPreparingPay] = useState(false);
  const [prepError, setPrepError]       = useState('');

  const [processing, setProcessing]   = useState(false);
  const [payError, setPayError]       = useState('');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [step]);

  // Load vehicle
  const fetchVehicle = useCallback(async () => {
    if (!carId) { setVehError('Không tìm thấy thông tin xe.'); setLoadVeh(false); return; }
    setLoadVeh(true);
    try {
      const v = await vehicleService.getById(carId);
      if (!v) throw new Error('Xe không tồn tại');
      setVehicle(v);
    } catch {
      setVehError('Không thể tải thông tin xe. Vui lòng thử lại.');
    } finally {
      setLoadVeh(false);
    }
  }, [carId]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

  const days       = Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000));
  const subtotal   = (vehicle?.price || 0) * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const total      = subtotal + serviceFee;

  // Step 1 → Step 2: tạo booking + payment intent, lấy clientSecret
  const handleContinue = async () => {
    if (!vehicle) return;
    setPreparingPay(true);
    setPrepError('');
    try {
      const booking = await bookingService.createBooking({
        vehicle_id:  vehicle._id || vehicle.id,
        showroom_id: vehicle.addedBy,
        start_date:  new Date(pickupDate).toISOString(),
        end_date:    new Date(returnDate).toISOString(),
        total_price: total,
      });
      const bId = booking?._id || booking?.id || booking;
      setBookingId(bId);

      const paymentData  = await paymentService.createPayment(bId);
      const secret       = paymentData?.client_secret || paymentData?.clientSecret;

      if (!secret) throw new Error('Không nhận được thông tin thanh toán từ server.');
      setClientSecret(secret);
      setStep(2);
    } catch (err) {
      setPrepError(err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setPreparingPay(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loadingVehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center gap-3 text-gray-500">
        <FaSpinner aria-hidden="true" className="animate-spin text-primary text-xl" />
        <span>Đang tải thông tin xe…</span>
      </div>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-gray-500 px-5">
        <FaExclamationCircle aria-hidden="true" className="text-red-500 text-4xl" />
        <p className="text-center text-red-600">{vehicleError || 'Không tìm thấy xe.'}</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>Về trang chủ</button>
      </div>
    );
  }

  const stripeOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#0077b6' } } }
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-5">

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-2">
          {[1, 2].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? <FaCheckCircle aria-hidden="true" /> : s}
              </div>
              {i < 1 && <div className={`h-1 rounded ${step > s ? 'bg-primary' : 'bg-gray-200'}`} style={{ width: 80 }} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center gap-16 mt-2 text-xs text-gray-500">
          <span>Thông tin</span><span>Thanh toán</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto flex gap-6 flex-wrap">
        {/* Main panel */}
        <div className="flex-1 min-w-[280px]">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Thông tin đặt xe</h2>

              {/* Vehicle mini card */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl mb-6 border border-gray-100">
                <img
                  src={vehicle.image || ''}
                  alt={vehicle.name}
                  width={96} height={64}
                  className="w-24 h-16 object-cover rounded-lg shrink-0 bg-gray-200"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">{vehicle.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-3 flex-wrap">
                    <span>{vehicle.seats} chỗ</span>
                    <span>{vehicle.fuel}</span>
                    <span>{vehicle.transmission}</span>
                  </div>
                  {vehicle.location && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MdLocationOn aria-hidden="true" size={12} /> {vehicle.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Datetime */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="pickup-date" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <FaCalendarAlt aria-hidden="true" className="inline mr-1" /> Nhận xe
                  </label>
                  <input
                    id="pickup-date"
                    type="datetime-local"
                    value={pickupDate}
                    min={defaultPickup()}
                    onChange={e => setPickupDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="return-date" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <FaCalendarAlt aria-hidden="true" className="inline mr-1" /> Trả xe
                  </label>
                  <input
                    id="return-date"
                    type="datetime-local"
                    value={returnDate}
                    min={pickupDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {prepError && (
                <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <FaExclamationCircle aria-hidden="true" className="shrink-0" /> {prepError}
                </div>
              )}

              <button
                type="button"
                className="btn-primary w-full justify-center py-3"
                onClick={handleContinue}
                disabled={!pickupDate || !returnDate || preparingPay}
              >
                {preparingPay
                  ? <><FaSpinner aria-hidden="true" className="animate-spin" /> Đang chuẩn bị…</>
                  : 'Tiếp tục thanh toán →'}
              </button>
            </div>
          )}

          {/* STEP 2 — Stripe Elements */}
          {step === 2 && clientSecret && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Thanh toán qua Stripe</h2>
              <p className="text-xs text-gray-400 mb-5">Thông tin thẻ được bảo mật bởi Stripe — chúng tôi không lưu dữ liệu thẻ của bạn.</p>

              {payError && (
                <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <FaExclamationCircle aria-hidden="true" className="shrink-0" /> {payError}
                </div>
              )}

              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripeCardForm
                  bookingId={bookingId}
                  processing={processing}
                  setProcessing={setProcessing}
                  onError={setPayError}
                  onSuccess={() => {}}
                />
              </Elements>

              <button
                type="button"
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 underline"
                onClick={() => { setStep(1); setClientSecret(''); }}
              >
                ← Quay lại chỉnh thông tin
              </button>
            </div>
          )}
        </div>

        {/* Sidebar — tóm tắt */}
        <div className="w-full md:w-72 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Tóm tắt đơn hàng</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{vehicle.price?.toLocaleString('vi-VN')}đ × {days} ngày</span>
                <span className="tabular-nums font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><FaTag aria-hidden="true" size={11} /> Phí dịch vụ (5%)</span>
                <span className="tabular-nums font-medium">{serviceFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Tổng cộng</span>
                <span className="tabular-nums text-primary">{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 leading-relaxed">
              Bằng cách đặt xe, bạn đồng ý với{' '}
              <a href="#" className="underline text-primary">Điều khoản sử dụng</a> và{' '}
              <a href="#" className="underline text-primary">Chính sách bảo mật</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
