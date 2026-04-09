import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  FaCheckCircle, FaTag, FaArrowRight, FaCalendarAlt,
  FaStar, FaChevronLeft, FaCarSide, FaLock, FaSpinner
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import vehicleService from '../../../services/vehicleService';
import bookingService from '../../../services/bookingService';
import paymentService from '../../../services/paymentService';
import { useAuth } from '../../../contexts/AuthContext';

const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

// ---- Inner payment form (must be inside <Elements>) ----
const StripePaymentForm = ({ total, onBack, onProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError('');
    onProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/renter/payment-result`,
      },
    });

    // Only reached if there is an immediate error (redirect does not happen)
    if (error) {
      setPayError(error.message || 'Thanh toán thất bại. Vui lòng thử lại.');
      setPaying(false);
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="animate-fade-in">
      <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
        <FaLock className="text-primary" size={18} aria-hidden="true" /> Thanh toán qua Stripe
      </h2>

      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <PaymentElement options={{ layout: 'accordion' }} />
      </div>

      {payError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[0.85rem] font-bold" role="alert">
          {payError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={paying}
          className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[1rem] rounded-xl transition-colors flex-[0.7] whitespace-nowrap disabled:opacity-50"
        >
          Quay lại
        </button>
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[1rem] rounded-xl shadow-[0_4px_14px_rgba(135,206,235,0.4)] transition-colors hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? <FaSpinner className="animate-spin" aria-hidden="true" /> : null}
          Thanh toán <span className="tabular-nums">{Number(total).toLocaleString('vi-VN')}đ</span>
        </button>
      </div>
    </form>
  );
};

// ---- Main Checkout component ----
const Checkout = () => {
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Entry mode: new booking from vehicleId, or resume existing bookingId
  const resumeBookingId = searchParams.get('bookingId');
  const vehicleId = carId; // from URL param

  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState('');

  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Booking + payment state
  const [bookingId, setBookingId] = useState(resumeBookingId || null);
  const [clientSecret, setClientSecret] = useState(null);
  const [initError, setInitError] = useState('');
  const [initLoading, setInitLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  // Load vehicle details
  useEffect(() => {
    if (resumeBookingId) {
      // Resume mode: load booking to get vehicle info
      setVehicleLoading(true);
      bookingService.getBookingById(resumeBookingId)
        .then(async (booking) => {
          if (booking?.vehicle_id) {
            try {
              const v = await vehicleService.getById(booking.vehicle_id);
              setVehicle(v);
            } catch {
              setVehicleError('Không thể tải thông tin xe.');
            }
          }
        })
        .catch(() => setVehicleError('Không thể tải thông tin booking.'))
        .finally(() => setVehicleLoading(false));
    } else if (vehicleId) {
      setVehicleLoading(true);
      vehicleService.getById(vehicleId)
        .then((v) => setVehicle(v))
        .catch(() => setVehicleError('Không tìm thấy thông tin xe.'))
        .finally(() => setVehicleLoading(false));
    }
  }, [vehicleId, resumeBookingId]);

  const days = Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000));
  const pricePerDay = vehicle?.price || 0;
  const subtotal = pricePerDay * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  // Called when user clicks "Tiếp tục thanh toán" on step 1
  const handleGoToPayment = useCallback(async () => {
    if (!vehicle) return;
    setInitLoading(true);
    setInitError('');
    try {
      let currentBookingId = bookingId;

      if (!resumeBookingId) {
        // Create a new booking (showroom_id = vehicle owner/addedBy)
        const newBooking = await bookingService.createBooking({
          vehicle_id: vehicle._id,
          showroom_id: vehicle.addedBy,
          start_date: new Date(pickupDate).toISOString(),
          end_date: new Date(returnDate).toISOString(),
          total_price: total,
        });
        currentBookingId = newBooking._id;
        setBookingId(currentBookingId);
      }

      // Check existing payment state first (avoid double-creating)
      const state = await paymentService.getPaymentState(currentBookingId);
      if (state.bookingStatus === 'paid' && state.paymentStatus === 'successful') {
        setInitError('Booking này đã được thanh toán trước đó.');
        setInitLoading(false);
        return;
      }

      // Create (or reuse) Stripe PaymentIntent
      const paymentData = await paymentService.createPayment(currentBookingId);
      setClientSecret(paymentData.client_secret);
      setStep(2);
    } catch (err) {
      setInitError(err.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setInitLoading(false);
    }
  }, [vehicle, bookingId, resumeBookingId, pickupDate, returnDate, total]);

  const stripeOptions = clientSecret ? { clientSecret, locale: 'vi' } : null;

  // --- Vehicle display helpers ---
  const displayName = vehicle
    ? `${vehicle.brand || ''} ${vehicle.vehicle_model || vehicle.model || ''}`.trim()
    : 'Đang tải...';
  const displayAddress = vehicle?.location || vehicle?.address || '';
  const displayPrice = pricePerDay;
  const displayImage = vehicle?.images?.[0] || vehicle?.image || null;
  const displayRating = vehicle?.rating || 0;
  const displayTrips = vehicle?.trip_count || vehicle?.trips || 0;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-5 font-[inherit]">
      <div className="max-w-[1100px] mx-auto">
        <button
          type="button"
          className="flex items-center gap-2 text-[0.85rem] text-slate-500 font-bold mb-6 hover:text-primary transition-colors cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <FaChevronLeft size={12} aria-hidden="true" /> Quay lại
        </button>

        {/* Steps indicator */}
        <div className="flex items-center justify-center max-w-[600px] mx-auto mb-10 relative z-10">
          {['Xác nhận đặt xe', 'Thanh toán', 'Hoàn tất'].map((label, i) => {
            const isActive = step >= i + 1;
            const isDone = step > i + 1;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-2 relative z-10 w-[110px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[0.95rem] transition-colors duration-300 shadow-sm
                    ${isActive ? (isDone ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-primary text-white shadow-[0_0_0_4px_rgba(135,206,235,0.2)]') : 'bg-slate-200 text-slate-500'}`}>
                    {isDone ? <FaCheckCircle size={18} aria-hidden="true" /> : i + 1}
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

        {/* Vehicle loading error */}
        {vehicleError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[0.875rem] font-bold" role="alert">
            {vehicleError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Main Content */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-8">

            {/* Step 1: Trip Info */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">Thông tin chuyến đi</h2>

                {/* Vehicle card */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 mb-6 overflow-hidden">
                  <div className="w-full h-48 relative overflow-hidden bg-slate-100">
                    {vehicleLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-slate-300 text-3xl" aria-hidden="true" />
                      </div>
                    ) : displayImage ? (
                      <img
                        src={displayImage}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <FaCarSide className="text-[4rem] text-slate-300" aria-hidden="true" />
                      </div>
                    )}
                    {displayRating > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 px-2.5 py-1 rounded-lg text-[0.75rem] font-bold text-white shadow-sm">
                        <FaStar size={10} aria-hidden="true" /> <span className="tabular-nums">{displayRating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[1.05rem] text-slate-800">{displayName || '—'}</h3>
                      {displayAddress && (
                        <div className="flex items-center gap-1.5 text-[0.8rem] text-slate-500 mt-1">
                          <MdLocationOn size={14} className="text-slate-400" aria-hidden="true" /> {displayAddress}
                        </div>
                      )}
                      {displayPrice > 0 && (
                        <div className="flex items-center gap-1 text-[0.8rem] font-medium text-slate-500 mt-1">
                          {displayTrips > 0 && <><span className="text-slate-400 tabular-nums">{displayTrips} chuyến</span><span className="mx-1 text-slate-300">•</span></>}
                          <span className="font-bold text-primary tabular-nums">{Number(displayPrice).toLocaleString('vi-VN')}đ<span className="text-slate-400 font-normal">/ngày</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date pickers — hidden in resume mode */}
                {!resumeBookingId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="pickup-date" className="block text-[0.8rem] font-bold text-slate-600 mb-2 uppercase tracking-wide">Nhận xe</label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input
                          id="pickup-date"
                          type="datetime-local"
                          value={pickupDate}
                          onChange={e => setPickupDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-[0.9rem] font-medium text-slate-700 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="return-date" className="block text-[0.8rem] font-bold text-slate-600 mb-2 uppercase tracking-wide">Trả xe</label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input
                          id="return-date"
                          type="datetime-local"
                          value={returnDate}
                          onChange={e => setReturnDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-[0.9rem] font-medium text-slate-700 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {initError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[0.85rem] font-bold" role="alert">
                    {initError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoToPayment}
                  disabled={initLoading || vehicleLoading || !!vehicleError}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[1rem] rounded-xl shadow-[0_4px_14px_rgba(135,206,235,0.4)] hover:shadow-[0_6px_20px_rgba(135,206,235,0.5)] transition-colors hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {initLoading ? <FaSpinner className="animate-spin" aria-hidden="true" /> : <FaArrowRight size={14} aria-hidden="true" />}
                  {initLoading ? 'Đang xử lý…' : 'Tiếp tục thanh toán'}
                </button>
              </div>
            )}

            {/* Step 2: Stripe Payment */}
            {step === 2 && stripeOptions && (
              stripePromise ? (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <StripePaymentForm
                    total={total}
                    onBack={() => setStep(1)}
                    onProcessing={setIsProcessing}
                  />
                </Elements>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[0.9rem] font-semibold">
                  Thiếu cấu hình Stripe publishable key. Vui lòng thêm `REACT_APP_STRIPE_PUBLIC_KEY` vào `frontend/.env` và khởi động lại frontend.
                </div>
              )
            )}

            {/* Step 3: Processing spinner (shown briefly before Stripe redirect) */}
            {(step === 3 || isProcessing) && (
              <div className="text-center py-10 animate-fade-in">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-[3rem] mb-6 relative">
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" aria-hidden="true" />
                  <FaCheckCircle className="animate-pulse" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Đang xử lý giao dịch</h2>
                <p className="text-slate-500 font-medium">Vui lòng không đóng trình duyệt trong quá trình này…</p>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-8 lg:sticky lg:top-24">
            <h3 className="font-extrabold text-[1.1rem] text-slate-800 mb-5 pb-4 border-b border-slate-100">Chi tiết thanh toán</h3>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center text-[0.9rem]">
                <span className="text-slate-500 font-bold">
                  Đơn giá thuê <span className="tabular-nums">({days} ngày)</span>
                </span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {subtotal > 0 ? Number(subtotal).toLocaleString('vi-VN') + 'đ' : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[0.9rem]">
                <span className="text-slate-500 font-bold">Phí dịch vụ <span className="text-[0.7rem] bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-600">5%</span></span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {serviceFee > 0 ? Number(serviceFee).toLocaleString('vi-VN') + 'đ' : '—'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-end mb-6">
              <span className="font-extrabold text-[1.05rem] text-slate-800">Tổng thanh toán</span>
              <div className="text-right">
                <span className="block text-[1.6rem] font-black text-primary leading-none tabular-nums">
                  {total > 0 ? Number(total).toLocaleString('vi-VN') + 'đ' : '—'}
                </span>
                <span className="text-[0.75rem] text-slate-400 font-bold mt-1.5 block">Đã bao gồm VAT</span>
              </div>
            </div>

            <div className="bg-emerald-50 text-emerald-700 rounded-xl p-4 text-[0.8rem] font-bold border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2"><FaCheckCircle size={14} className="text-emerald-500" aria-hidden="true" /> Hủy miễn phí trước 1h nhận xe</div>
              <div className="flex items-center gap-2"><FaCheckCircle size={14} className="text-emerald-500" aria-hidden="true" /> Bảo hiểm chuyến đi toàn diện</div>
              <div className="flex items-center gap-2"><FaCheckCircle size={14} className="text-emerald-500" aria-hidden="true" /> Thanh toán an toàn qua Stripe</div>
              <div className="flex items-center gap-2">
                <FaTag size={14} className="text-emerald-500" aria-hidden="true" />
                <span>Bảo mật SSL 256-bit</span>
              </div>
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
