import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { resolveRentalWindow } from '../../../utils/rentalWindow';

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

const pad2 = (n) => String(n).padStart(2, '0');

function toLocalInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function parseLocalDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeIncomingRentalWindow(pickupValue, returnValue, minPickupValue) {
  const minPickup = parseLocalDateTime(minPickupValue);
  const incomingPickup = parseLocalDateTime(pickupValue);
  const incomingReturn = parseLocalDateTime(returnValue);

  if (!incomingPickup || !incomingReturn || !minPickup) {
    return null;
  }

  const safePickup = incomingPickup < minPickup ? new Date(minPickup) : new Date(incomingPickup);
  const safeReturn = incomingReturn <= safePickup
    ? new Date(safePickup.getTime() + 60 * 60 * 1000)
    : new Date(incomingReturn);

  return {
    pickupDate: toLocalInputValue(safePickup),
    returnDate: toLocalInputValue(safeReturn),
  };
}

function formatDateTimeInputLabel(isoLocal) {
  const d = parseLocalDateTime(isoLocal);
  if (!d) return 'Chọn ngày giờ';
  const hour12 = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? 'CH' : 'SA';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(hour12)}:${pad2(d.getMinutes())} ${ampm}`;
}

const CALENDAR_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const CALENDAR_MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

function DateTimeField({ id, label, value, minValue, onChange }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedDate = parseLocalDateTime(value) || new Date();
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const minDate = parseLocalDateTime(minValue);
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedYear, selectedMonth, 1)
  );

  useEffect(() => {
    setViewMonth(new Date(selectedYear, selectedMonth, 1));
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = (first.getDay() + 6) % 7;

  const applyDate = (nextDate) => {
    if (!nextDate || Number.isNaN(nextDate.getTime())) return;
    if (minDate && nextDate < minDate) {
      onChange(toLocalInputValue(minDate));
      return;
    }
    onChange(toLocalInputValue(nextDate));
  };

  const onSelectDay = (day) => {
    const next = new Date(selectedDate);
    next.setFullYear(year, month, day);
    applyDate(next);
  };

  const hour12 = selectedDate.getHours() % 12 || 12;
  const minute = selectedDate.getMinutes();
  const ampm = selectedDate.getHours() >= 12 ? 'CH' : 'SA';

  const onHourChange = (nextHour12) => {
    const next = new Date(selectedDate);
    const h = Number(nextHour12) % 12;
    next.setHours(ampm === 'CH' ? h + 12 : h);
    applyDate(next);
  };

  const onMinuteChange = (nextMinute) => {
    const next = new Date(selectedDate);
    next.setMinutes(Number(nextMinute));
    applyDate(next);
  };

  const onAmPmChange = (nextAmPm) => {
    const next = new Date(selectedDate);
    const h12 = next.getHours() % 12;
    next.setHours(nextAmPm === 'CH' ? h12 + 12 : h12);
    applyDate(next);
  };

  return (
    <div className="relative" ref={rootRef}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
        <FaCalendarAlt aria-hidden="true" className="text-primary/80" />
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-left hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
        onClick={() => setOpen((v) => !v)}
      >
        {formatDateTimeInputLabel(value)}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute z-30 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-lg p-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              className="h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            >
              {'<'}
            </button>
            <select
              className="h-8 rounded-md border border-gray-200 px-2 text-sm"
              value={month}
              onChange={(e) => setViewMonth(new Date(year, Number(e.target.value), 1))}
            >
              {CALENDAR_MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-gray-200 px-2 text-sm"
              value={year}
              onChange={(e) => setViewMonth(new Date(Number(e.target.value), month, 1))}
            >
              {Array.from({ length: 11 }).map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              className="ml-auto h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            >
              {'>'}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] text-gray-500 mb-1">
            {CALENDAR_DAYS.map((d) => (
              <div key={d} className="font-semibold py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {Array.from({ length: leadingEmpty }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const cur = new Date(year, month, day, selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;
              const disabled = !!(minDate && cur < minDate);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  className={`h-9 rounded-md text-sm transition ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-primary-light'
                  } ${disabled ? 'opacity-35 cursor-not-allowed hover:bg-transparent' : ''}`}
                  onClick={() => onSelectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
            <select
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
              value={hour12}
              onChange={(e) => onHourChange(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const v = i + 1;
                return (
                  <option key={v} value={v}>
                    {pad2(v)}
                  </option>
                );
              })}
            </select>
            <select
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
              value={minute}
              onChange={(e) => onMinuteChange(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const v = i * 5;
                return (
                  <option key={v} value={v}>
                    {pad2(v)}
                  </option>
                );
              })}
            </select>
            <select
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
              value={ampm}
              onChange={(e) => onAmPmChange(e.target.value)}
            >
              <option value="SA">SA</option>
              <option value="CH">CH</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => applyDate(new Date())}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
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

    const returnUrl = `${window.location.origin}/renter/payment-result?bookingId=${bookingId}`;
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
            <span className="underline text-primary">
              Điều khoản sử dụng
            </span>{' '}
            và{' '}
            <span className="underline text-primary">
              Chính sách bảo mật
            </span>
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
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadVeh] = useState(true);
  const [vehicleError, setVehError] = useState('');

  const [pickupDate, setPickupDate] = useState(defaultPickup);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [pickupMethod, setPickupMethod] = useState('self');
  const minPickupDateTime = useMemo(() => defaultPickup(), []);
  const incomingRentalWindow = useMemo(
    () => resolveRentalWindow({ state: location.state, search: location.search }),
    [location.search, location.state]
  );

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

  useEffect(() => {
    if (!incomingRentalWindow.pickupDate || !incomingRentalWindow.returnDate) {
      return;
    }

    const sanitizedWindow = normalizeIncomingRentalWindow(
      incomingRentalWindow.pickupDate,
      incomingRentalWindow.returnDate,
      minPickupDateTime
    );

    if (!sanitizedWindow) {
      return;
    }

    setPickupDate(sanitizedWindow.pickupDate);
    setReturnDate(sanitizedWindow.returnDate);
  }, [incomingRentalWindow.pickupDate, incomingRentalWindow.returnDate, minPickupDateTime]);

  useEffect(() => {
    const pick = parseLocalDateTime(pickupDate);
    const ret = parseLocalDateTime(returnDate);
    if (pick && ret && ret < pick) {
      setReturnDate(toLocalInputValue(pick));
    }
  }, [pickupDate, returnDate]);

  useEffect(() => {
    if (prepError) {
      setPrepError('');
    }
  }, [pickupDate, prepError, pickupMethod, returnDate]);

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
      const minPickup = parseLocalDateTime(minPickupDateTime);
      const pickup = parseLocalDateTime(pickupDate);
      const ret = parseLocalDateTime(returnDate);

      if (!pickup || !ret) {
        throw new Error('Vui long chon day du thoi gian nhan xe va tra xe.');
      }

      if (minPickup && pickup < minPickup) {
        throw new Error('Thoi gian nhan xe khong hop le. Vui long chon mot moc thoi gian o hien tai hoac trong tuong lai.');
      }

      if (ret <= pickup) {
        throw new Error('Thoi gian tra xe phai sau thoi gian nhan xe.');
      }

      const availability = await bookingService.checkAvailability({
        vehicleId: vehicle._id || vehicle.id,
        pickupDate: pickup.toISOString(),
        returnDate: ret.toISOString(),
      });

      if (!availability?.isAvailable) {
        throw new Error(
          availability?.message
          || 'Xe da co lich thue trung trong khung thoi gian ban chon. Vui long doi sang moc thoi gian khac.'
        );
      }

      const booking = await bookingService.createBooking({
        vehicle_id: vehicle._id || vehicle.id,
        showroom_id: vehicle.addedBy,
        start_date: pickup.toISOString(),
        end_date: ret.toISOString(),
        total_price: total,
      });
      const bId = booking?._id || booking?.id || booking;
      setBookingId(bId);

      const paymentData = await paymentService.createPayment({
        bookingId: bId,
        amount: Number(booking?.total_price || total),
      });
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
                  <DateTimeField
                    id="pickup-date"
                    label="Thời gian nhận xe"
                    value={pickupDate}
                    minValue={minPickupDateTime}
                    onChange={setPickupDate}
                  />
                  <DateTimeField
                    id="return-date"
                    label="Thời gian trả xe"
                    value={returnDate}
                    minValue={pickupDate}
                    onChange={setReturnDate}
                  />
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
