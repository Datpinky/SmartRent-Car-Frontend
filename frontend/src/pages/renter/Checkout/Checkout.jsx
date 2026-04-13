import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  FaCheckCircle,
  FaCalendarAlt,
  FaSpinner,
  FaExclamationCircle,
  FaTag,
  FaStar,
  FaCar,
  FaArrowRight,
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import vehicleService from '../../../services/vehicleService';
import bookingService from '../../../services/bookingService';
import paymentService from '../../../services/paymentService';

const DELIVERY_FEE_VND = 50000;

/**
 * Tắt Stripe.js Testing Assistant (UI nổi “stripe” / sandbox assistant trên trang thanh toán).
 * Bật lại khi debug: REACT_APP_STRIPE_TESTING_ASSISTANT=true trong .env
 * @see https://docs.stripe.com/js/initializing#stripe_js_initialize-options-developerTools-assistant-enabled
 */
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY, {
  developerTools: {
    assistant: {
      enabled: process.env.REACT_APP_STRIPE_TESTING_ASSISTANT === 'true',
    },
  },
});

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

function formatDateTimeVi(isoLocal) {
  try {
    const d = new Date(isoLocal);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─── Inner card form (must be inside <Elements>) ─────────────────────────────
const StripeCardForm = ({ onError, bookingId, processing, setProcessing }) => {
  const stripe = useStripe();
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
        {processing ? (
          <>
            <FaSpinner aria-hidden="true" className="animate-spin" /> Đang xử lý…
          </>
        ) : (
          'Thanh toán ngay'
        )}
      </button>
    </form>
  );
};

function StarRow({ rating }) {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`Đánh giá ${r} trên 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar
          key={n}
          className={`text-[0.85rem] ${n <= r ? 'text-amber-400' : 'text-gray-200'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function OrderSummaryPanel({
  vehicle,
  pickupDate,
  returnDate,
  days,
  subtotal,
  serviceFee,
  deliveryFee,
  total,
}) {
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[0.95rem]">Tóm tắt đơn hàng</h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-gray-100/90 px-3 py-3 border border-gray-100">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FaCar aria-hidden="true" className="text-lg" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-[0.88rem] leading-snug line-clamp-2">
                {vehicle.name}
              </p>
              <p className="text-[0.72rem] text-gray-500 mt-0.5">SmartRent</p>
            </div>
          </div>

          <dl className="space-y-2 text-[0.82rem] text-gray-600">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500 shrink-0">Nhận xe</dt>
              <dd className="tabular-nums text-right text-gray-800 font-medium">
                {formatDateTimeVi(pickupDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500 shrink-0">Trả xe</dt>
              <dd className="tabular-nums text-right text-gray-800 font-medium">
                {formatDateTimeVi(returnDate)}
              </dd>
            </div>
          </dl>

          <div className="h-px bg-gray-100" />

          <div className="space-y-2.5 text-[0.82rem]">
            <div className="flex justify-between gap-3 text-gray-600">
              <span>
                {vehicle.price?.toLocaleString('vi-VN')}đ × {days} ngày
              </span>
              <span className="tabular-nums font-medium text-gray-800">
                {subtotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between gap-3 text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <FaTag aria-hidden="true" className="opacity-70 text-[0.7rem]" />
                Phí dịch vụ (5%)
              </span>
              <span className="tabular-nums font-medium text-gray-800">
                {serviceFee.toLocaleString('vi-VN')}đ
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between gap-3 text-gray-600">
                <span>Giao tận nơi</span>
                <span className="tabular-nums font-medium text-gray-800">
                  +{deliveryFee.toLocaleString('vi-VN')}đ
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-gray-200">
            <span className="font-bold text-gray-900 text-[0.95rem]">Tổng cộng</span>
            <span className="tabular-nums text-xl font-bold text-primary">
              {total.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary-light/50 px-3.5 py-3 text-[0.72rem] text-gray-600 leading-relaxed">
            <ul className="list-disc pl-4 space-y-1.5 marker:text-primary">
              <li>Miễn phí hủy trước 1 giờ so với giờ nhận xe (theo chính sách đơn cụ thể).</li>
              <li>Thanh toán qua Stripe, thông tin thẻ được mã hóa.</li>
              <li>
                Điều kiện bảo hiểm và trách nhiệm theo hợp đồng thuê — SmartRent không cam kết mức bảo hiểm cụ thể trong chuyến đi.
              </li>
            </ul>
          </div>

          <p className="text-[0.7rem] text-gray-400 leading-relaxed">
            Bằng cách đặt xe, bạn đồng ý với{' '}
            <a href="#" className="underline text-primary hover:text-primary-dark">
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#" className="underline text-primary hover:text-primary-dark">
              Chính sách bảo mật
            </a>
            .
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Checkout page ───────────────────────────────────────────────────────
const Checkout = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadVeh] = useState(true);
  const [vehicleError, setVehError] = useState('');

  const [pickupDate, setPickupDate] = useState(defaultPickup);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [pickupMethod, setPickupMethod] = useState('self');

  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [preparingPay, setPreparingPay] = useState(false);
  const [prepError, setPrepError] = useState('');

  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const fetchVehicle = useCallback(async () => {
    if (!carId) {
      setVehError('Không tìm thấy thông tin xe.');
      setLoadVeh(false);
      return;
    }
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

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const days = Math.max(
    1,
    Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000)
  );
  const subtotal = (vehicle?.price || 0) * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const deliveryFee = pickupMethod === 'delivery' ? DELIVERY_FEE_VND : 0;
  const total = subtotal + serviceFee + deliveryFee;

  const priceLine = useMemo(() => {
    if (!vehicle?.price) return '—';
    return `${Number(vehicle.price).toLocaleString('vi-VN')}đ / ngày`;
  }, [vehicle]);

  const handleContinue = async () => {
    if (!vehicle) return;
    setPreparingPay(true);
    setPrepError('');
    try {
      const booking = await bookingService.createBooking({
        vehicle_id: vehicle._id || vehicle.id,
        showroom_id: vehicle.addedBy,
        start_date: new Date(pickupDate).toISOString(),
        end_date: new Date(returnDate).toISOString(),
        total_price: total,
      });
      const bId = booking?._id || booking?.id || booking;
      setBookingId(bId);

      const paymentData = await paymentService.createPayment(bId);
      const secret = paymentData?.client_secret || paymentData?.clientSecret;

      if (!secret) throw new Error('Không nhận được thông tin thanh toán từ server.');
      setClientSecret(secret);
      setStep(2);
    } catch (err) {
      setPrepError(err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setPreparingPay(false);
    }
  };

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
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  const stripeOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#0077b6' } } }
    : undefined;

  const summaryProps = {
    vehicle,
    pickupDate,
    returnDate,
    days,
    subtotal,
    serviceFee,
    deliveryFee,
    total,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-5">
      <div className="max-w-[1100px] mx-auto">
        {/* Step indicator — gọn, không lấn layout mockup */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? <FaCheckCircle aria-hidden="true" /> : s}
                </div>
                {i < 1 && (
                  <div
                    className={`h-1 rounded ${step > s ? 'bg-primary' : 'bg-gray-200'}`}
                    style={{ width: 72 }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[0.75rem] text-gray-500">
            {step === 1 ? 'Thông tin đặt xe' : 'Thanh toán'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="min-w-0">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <FaCar aria-hidden="true" className="text-xl" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Thông tin đặt xe
                  </h2>
                </div>

                {/* Vehicle — viền nhạt theo theme */}
                <div className="rounded-xl border-2 border-primary/25 bg-primary-light/35 p-4 sm:p-5 mb-8">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    <div className="shrink-0 mx-auto sm:mx-0">
                      <img
                        src={vehicle.image || ''}
                        alt={vehicle.name}
                        width={160}
                        height={112}
                        className="w-full max-w-[200px] sm:w-40 h-28 object-cover rounded-xl bg-gray-200 border border-white shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <h3 className="font-bold text-gray-900 text-[0.95rem] sm:text-base leading-snug">
                        {vehicle.name}
                      </h3>
                      <StarRow rating={vehicle.rating} />
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-2.5 py-0.5 text-[0.72rem] font-medium text-gray-700 shadow-sm">
                          {vehicle.seats} chỗ
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-2.5 py-0.5 text-[0.72rem] font-medium text-gray-700 shadow-sm">
                          {vehicle.transmission}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-2.5 py-0.5 text-[0.72rem] font-medium text-gray-700 shadow-sm">
                          {vehicle.fuel}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-2.5 py-0.5 text-[0.72rem] font-medium text-gray-700 shadow-sm">
                          {vehicle.type || vehicle.category}
                        </span>
                      </div>
                      {vehicle.location && (
                        <p className="text-[0.72rem] text-gray-500 flex items-start gap-1 mt-1">
                          <MdLocationOn aria-hidden="true" className="shrink-0 mt-0.5" size={14} />
                          <span className="line-clamp-2">{vehicle.location}</span>
                        </p>
                      )}
                      <p className="text-primary font-extrabold text-lg sm:text-xl tabular-nums mt-auto pt-2">
                        {priceLine}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[0.8rem] font-semibold text-gray-800 mb-3">Thời gian thuê</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label
                      htmlFor="pickup-date"
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2"
                    >
                      <FaCalendarAlt aria-hidden="true" className="text-primary/80" />
                      Thời gian nhận xe
                    </label>
                    <input
                      id="pickup-date"
                      type="datetime-local"
                      value={pickupDate}
                      min={defaultPickup()}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="return-date"
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2"
                    >
                      <FaCalendarAlt aria-hidden="true" className="text-primary/80" />
                      Thời gian trả xe
                    </label>
                    <input
                      id="return-date"
                      type="datetime-local"
                      value={returnDate}
                      min={pickupDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-[0.75rem] font-semibold text-primary border border-primary/20">
                    Tổng thuê: {days} ngày
                  </span>
                </div>

                <p className="text-[0.8rem] font-semibold text-gray-800 mb-3">Hình thức nhận xe</p>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
                  role="radiogroup"
                  aria-label="Hình thức nhận xe"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={pickupMethod === 'self'}
                    onClick={() => setPickupMethod('self')}
                    className={`text-left rounded-xl border-2 p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      pickupMethod === 'self'
                        ? 'border-primary bg-primary-light/40 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-gray-900 text-[0.9rem]">Tự đến lấy</p>
                    <p className="text-primary font-semibold text-[0.85rem] mt-1">Miễn phí</p>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={pickupMethod === 'delivery'}
                    onClick={() => setPickupMethod('delivery')}
                    className={`text-left rounded-xl border-2 p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      pickupMethod === 'delivery'
                        ? 'border-primary bg-primary-light/40 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-gray-900 text-[0.9rem]">Giao tận nơi</p>
                    <p className="text-gray-600 font-semibold text-[0.85rem] mt-1">
                      + {DELIVERY_FEE_VND.toLocaleString('vi-VN')}đ
                    </p>
                  </button>
                </div>

                {prepError && (
                  <div
                    role="alert"
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
                  >
                    <FaExclamationCircle aria-hidden="true" className="shrink-0" /> {prepError}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-[0.95rem] rounded-xl"
                  onClick={handleContinue}
                  disabled={!pickupDate || !returnDate || preparingPay}
                >
                  {preparingPay ? (
                    <>
                      <FaSpinner aria-hidden="true" className="animate-spin" /> Đang chuẩn bị…
                    </>
                  ) : (
                    <>
                      Tiếp tục
                      <FaArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 2 && clientSecret && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Thanh toán qua Stripe</h2>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Thông tin thẻ được bảo mật bởi Stripe — chúng tôi không lưu dữ liệu thẻ của bạn.
                </p>

                {payError && (
                  <div
                    role="alert"
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
                  >
                    <FaExclamationCircle aria-hidden="true" className="shrink-0" /> {payError}
                  </div>
                )}

                <Elements stripe={stripePromise} options={stripeOptions}>
                  <StripeCardForm
                    bookingId={bookingId}
                    processing={processing}
                    setProcessing={setProcessing}
                    onError={setPayError}
                  />
                </Elements>

                <button
                  type="button"
                  className="mt-5 text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
                  onClick={() => {
                    setStep(1);
                    setClientSecret('');
                  }}
                >
                  ← Quay lại chỉnh thông tin
                </button>
              </div>
            )}
          </div>

          <OrderSummaryPanel {...summaryProps} />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
