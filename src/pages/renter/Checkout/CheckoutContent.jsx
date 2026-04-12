import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCar,
  FaCheckCircle,
  FaCreditCard,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaShieldAlt,
  FaStar,
  FaStore,
  FaUniversity,
} from 'react-icons/fa';
import { BsLightningChargeFill } from 'react-icons/bs';
import { MdDirectionsCar, MdPeople, MdSettings } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';
import bookingService from '../../../services/bookingService';
import paymentService from '../../../services/paymentService';
import { sanitizeImageUrl } from '../../../utils/media';

const PAYMENT_METHODS = [
  { id: 'Paypal', label: 'Vi dien tu', sub: 'MoMo, ZaloPay, VNPay (Paypal)', icon: <FaMobileAlt />, color: '#8b5cf6' },
  { id: 'stripe', label: 'The tin dung / ghi no', sub: 'Visa, Mastercard, JCB (Stripe)', icon: <FaCreditCard />, color: '#3b82f6' },
  { id: 'Bank Transfer', label: 'Chuyen khoan ngan hang', sub: 'ATM noi dia', icon: <FaUniversity />, color: '#0891b2' },
];

const STEPS = ['Xac nhan dat xe', 'Thanh toan', 'Hoan tat'];
const STRIPE_MAX_VND_AMOUNT = 99999999;

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      color: '#111827',
      fontSize: '16px',
      fontFamily: 'inherit',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#dc2626',
    },
  },
};

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const formatAmount = (amount, currency) => (currency === 'VND' ? `${fmt(amount)}d` : `${fmt(amount)} ${currency}`);

const toDateTimeLocalValue = (date) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

const createDefaultPickupDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60, 0, 0);
  return toDateTimeLocalValue(date);
};

const createDefaultReturnDate = (pickupDate) => {
  const date = new Date(pickupDate);
  date.setDate(date.getDate() + 2);
  return toDateTimeLocalValue(date);
};

const StarRow = ({ rating }) => (
  <span className="flex items-center gap-[2px]">
    {[1, 2, 3, 4, 5].map((i) => (
      <FaStar key={i} size={11} color={i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'} />
    ))}
    <span style={{ fontSize: '0.78rem', fontWeight: 700, marginLeft: 3, color: '#374151' }}>{rating}</span>
  </span>
);

const CarBanner = ({ car, normalizedCurrency }) => {
  if (!car) return null;

  const hue = Math.abs((car.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const imageUrl = sanitizeImageUrl(car.image);
  const fuelIcon = car.fuel === 'Dien'
    ? <BsLightningChargeFill style={{ color: '#2196f3' }} />
    : <span style={{ color: '#f59e0b' }}>xang</span>;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      border: '1.5px solid #bbf7d0',
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
    }}>
      <div style={{
        width: 120,
        height: 84,
        borderRadius: 10,
        overflow: 'hidden',
        background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <MdDirectionsCar style={{ fontSize: '3rem', color: car.color || `hsl(${hue},40%,50%)`, transform: 'scaleX(-1)' }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827', marginBottom: 3 }}>{car.name}</div>

        {car.showroom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280', marginBottom: 2 }}>
            <FaStore size={10} /> {car.showroom}
          </div>
        )}

        {car.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#00b14f', marginBottom: 4 }}>
            <FaMapMarkerAlt size={10} /> {car.location}
          </div>
        )}

        <StarRow rating={car.rating || 5} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {[
            { icon: <MdPeople size={12} />, label: `${car.seats || 5} cho` },
            { icon: <MdSettings size={12} />, label: car.transmission === 'So tu dong' ? 'Tu dong' : 'So san' },
            { icon: fuelIcon, label: car.fuel || 'Xang' },
            { icon: <FaCar size={12} />, label: car.category || 'Sedan' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(0,177,79,0.08)',
                color: '#059669',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00b14f', lineHeight: 1 }}>
          {formatAmount(car.price, normalizedCurrency)}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>/ngay</div>
      </div>
    </div>
  );
};

const CheckoutContent = ({ stripeConfigError = '' }) => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const stateData = useMemo(() => location.state || {}, [location.state]);
  const car = stateData.car;
  const initialPickupDate = useMemo(
    () => stateData.pickupDate || createDefaultPickupDate(),
    [stateData.pickupDate]
  );
  const initialReturnDate = useMemo(
    () => stateData.returnDate || createDefaultReturnDate(initialPickupDate),
    [stateData.returnDate, initialPickupDate]
  );

  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState('stripe');
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [address, setAddress] = useState('');
  const [dateErrors, setDateErrors] = useState({ pickup: '', returnD: '' });
  const [orderError, setOrderError] = useState('');
  const [cardError, setCardError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!car && !carId) {
      navigate('/');
    }
  }, [car, carId, navigate]);

  useEffect(() => {
    if (payMethod !== 'stripe') {
      setCardError('');
    }
  }, [payMethod]);

  const nowStr = useMemo(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }, []);

  const minReturnStr = useMemo(() => {
    if (!pickupDate) return nowStr;
    const d = new Date(pickupDate);
    d.setDate(d.getDate() + 1);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }, [pickupDate, nowStr]);

  const days = useMemo(() => {
    return Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000));
  }, [pickupDate, returnDate]);

  useEffect(() => {
    if (!car) return;

    const normalizedCurrency = String(car.currency || 'VND').toUpperCase();
    const canUseStripe = normalizedCurrency === 'VND' && !stripeConfigError;

    if (payMethod === 'stripe' && !canUseStripe) {
      setPayMethod('Bank Transfer');
    }
  }, [car, payMethod, stripeConfigError]);

  if (!car) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Dang tai thong tin xe...</div>;
  }

  const normalizedCurrency = String(car.currency || 'VND').toUpperCase();
  const isVND = normalizedCurrency === 'VND';
  const isStripeSelectable = isVND && !stripeConfigError;
  const unitPrice = Number(car.price || 0);
  const subtotalReal = unitPrice * days;
  const serviceFee = Math.round(subtotalReal * 0.05);
  const deliveryFee = deliveryType === 'delivery' ? 50000 : 0;
  const totalWithDelivery = subtotalReal + serviceFee + deliveryFee;
  const hasDateError = Boolean(dateErrors.pickup || dateErrors.returnD);

  const validatePickup = (val) => {
    if (!val) return 'Vui long chon thoi gian nhan xe';
    if (new Date(val) < new Date(nowStr)) return 'Thoi gian nhan xe khong duoc nam trong qua khu';
    return '';
  };

  const validateReturn = (pickup, ret) => {
    if (!ret) return 'Vui long chon thoi gian tra xe';
    if (new Date(ret) < new Date(nowStr)) return 'Thoi gian tra xe khong duoc nam trong qua khu';
    if ((new Date(ret) - new Date(pickup)) / 86400000 < 1) return 'Thoi gian tra xe phai sau nhan xe it nhat 1 ngay';
    return '';
  };

  const handlePickupChange = (val) => {
    setPickupDate(val);
    setDateErrors({
      pickup: validatePickup(val),
      returnD: validateReturn(val, returnDate),
    });
  };

  const handleReturnChange = (val) => {
    setReturnDate(val);
    setDateErrors((prev) => ({
      ...prev,
      returnD: validateReturn(pickupDate, val),
    }));
  };

  const handleOrder = async () => {
    if (isSubmitting) return;

    let cardElement = null;

    try {
      setOrderError('');
      setCardError('');
      setIsSubmitting(true);

      if (payMethod === 'stripe') {
        if (stripeConfigError) {
          throw new Error(stripeConfigError);
        }
        if (!isVND) {
          throw new Error('Stripe chi ho tro thanh toan cho xe niem yet bang VND.');
        }
        if (totalWithDelivery > STRIPE_MAX_VND_AMOUNT) {
          throw new Error('Tong thanh toan vuot gioi han Stripe 99.999.999d. Hay chon chuyen khoan ngan hang hoac giam thoi gian thue.');
        }
        if (!stripe || !elements) {
          throw new Error('Stripe dang khoi tao. Vui long doi trong giay lat va thu lai.');
        }

        cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Vui long nhap thong tin the truoc khi thanh toan.');
        }
      }

      const payload = {
        vehicle_id: car._id || car.id,
        start_date: new Date(pickupDate).toISOString(),
        end_date: new Date(returnDate).toISOString(),
        total_price: totalWithDelivery,
        payment_method: payMethod,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? address : '',
        note: '',
      };

      const result = await bookingService.createBooking(payload);
      const booking = result?.booking || result;
      const bookingId = booking?._id || booking?.id || result?._id;

      if (!bookingId) {
        throw new Error('Booking was created but no booking id was returned.');
      }

      if (payMethod === 'stripe') {
        const { clientSecret } = await paymentService.createPaymentIntent(bookingId);
        if (!clientSecret) {
          throw new Error('Backend did not return a Stripe client secret.');
        }

        const confirmResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.name || undefined,
              email: user?.email || undefined,
              phone: user?.phone || undefined,
            },
          },
        });

        if (confirmResult.error) {
          throw new Error(confirmResult.error.message || 'Khong the xac nhan thanh toan bang the.');
        }

        const paymentIntentId = confirmResult.paymentIntent?.id;
        const verification = await paymentService.verifyPaymentIntent(bookingId, paymentIntentId);

        if (!verification?.success) {
          throw new Error('Thanh toan chua hoan tat. Vui long thu lai.');
        }

        navigate(`/renter/payment-result?status=success&bookingId=${bookingId}`);
        return;
      }

      setStep(3);
      setTimeout(() => navigate(`/renter/payment-result?status=success&bookingId=${bookingId}`), 1200);
    } catch (err) {
      console.error('Booking error:', err);
      const msg = err.message || 'Unable to complete the booking.';
      setStep(2);
      const shouldShowCardError =
        payMethod === 'stripe'
        && (
          msg.toLowerCase().includes('card')
          || msg.toLowerCase().includes('the ')
          || msg.toLowerCase().includes('stripe dang khoi tao')
          || msg.toLowerCase().includes('xac nhan thanh toan')
        );
      if (shouldShowCardError) {
        setCardError(msg);
      } else {
        setOrderError(msg);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page" style={{ paddingBottom: 40 }}>
      <div className="checkout-steps">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`checkout-step ${step >= i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <div className="checkout-step-num">
                {step > i + 1 ? <FaCheckCircle /> : i + 1}
              </div>
              <span>{label}</span>
            </div>
            {i < 2 && <div className={`checkout-step-line ${step > i + 1 ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 1 && (
            <div className="checkout-card">
              <h3 className="checkout-section" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCar style={{ color: '#00b14f' }} /> Thong tin dat xe
              </h3>

              <CarBanner car={car} normalizedCurrency={normalizedCurrency} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 4 }}>
                <div>
                  <label className="checkout-label">
                    <FaCalendarAlt style={{ marginRight: 4, color: '#00b14f' }} />Thoi gian nhan xe
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupDate}
                    min={nowStr}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    className="checkout-input"
                    style={dateErrors.pickup ? { borderColor: '#ef4444' } : {}}
                  />
                  {dateErrors.pickup && (
                    <div style={{ fontSize: '0.73rem', color: '#ef4444', marginTop: 4 }}>
                      {dateErrors.pickup}
                    </div>
                  )}
                </div>

                <div>
                  <label className="checkout-label">
                    <FaCalendarAlt style={{ marginRight: 4, color: '#f59e0b' }} />Thoi gian tra xe
                  </label>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    min={minReturnStr}
                    onChange={(e) => handleReturnChange(e.target.value)}
                    className="checkout-input"
                    style={dateErrors.returnD ? { borderColor: '#ef4444' } : {}}
                  />
                  {dateErrors.returnD && (
                    <div style={{ fontSize: '0.73rem', color: '#ef4444', marginTop: 4 }}>
                      {dateErrors.returnD}
                    </div>
                  )}
                </div>
              </div>

              {!hasDateError && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: '6px 12px',
                    margin: '12px 0 16px',
                    fontSize: '0.82rem',
                    color: '#059669',
                    fontWeight: 600,
                  }}
                >
                  Tong thue: <strong>{days} ngay</strong>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="checkout-label">Hinh thuc nhan xe</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[['pickup', 'Tu den lay', 'Mien phi'], ['delivery', 'Giao tan noi', '+50.000d']].map(([val, label, fee]) => (
                    <button
                      key={val}
                      onClick={() => setDeliveryType(val)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `2px solid ${deliveryType === val ? '#00b14f' : '#e5e7eb'}`,
                        background: deliveryType === val ? '#f0fdf4' : '#fff',
                        color: deliveryType === val ? '#00b14f' : '#374151',
                        fontWeight: deliveryType === val ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                      <div style={{ fontSize: '0.72rem', color: deliveryType === val ? '#059669' : '#9ca3af', marginTop: 2 }}>{fee}</div>
                    </button>
                  ))}
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <div style={{ marginBottom: 16 }}>
                  <label className="checkout-label"><FaMapMarkerAlt style={{ marginRight: 4 }} />Dia chi giao xe</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhap dia chi giao xe cua ban..."
                    className="checkout-input"
                  />
                </div>
              )}

              <button
                className="checkout-btn-next"
                onClick={() => {
                  const pickupError = validatePickup(pickupDate);
                  const returnError = validateReturn(pickupDate, returnDate);
                  if (pickupError || returnError) {
                    setDateErrors({ pickup: pickupError, returnD: returnError });
                    return;
                  }
                  setStep(2);
                }}
                style={hasDateError ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Tiep tuc <FaArrowRight />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-card">
              <h3 className="checkout-section" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCreditCard style={{ color: '#00b14f' }} /> Phuong thuc thanh toan
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#f9fafb',
                  border: '1px solid #f0f0f0',
                  marginBottom: 18,
                }}
              >
                <MdDirectionsCar style={{ fontSize: '1.4rem', color: '#00b14f', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{car.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{days} ngay · {pickupDate.slice(0, 10)} &rarr; {returnDate.slice(0, 10)}</div>
                </div>
                <div style={{ fontWeight: 800, color: '#00b14f', fontSize: '0.95rem' }}>{formatAmount(totalWithDelivery, normalizedCurrency)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {PAYMENT_METHODS.map((m) => (
                  (() => {
                    const isDisabled = m.id === 'stripe' && !isStripeSelectable;
                    const subText = m.id === 'stripe' && !isVND
                      ? 'Chi ho tro xe co gia VND'
                      : (m.id === 'stripe' && stripeConfigError ? stripeConfigError : m.sub);

                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (!isDisabled) {
                            setPayMethod(m.id);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: `2px solid ${payMethod === m.id ? '#00b14f' : '#e5e7eb'}`,
                          background: payMethod === m.id ? '#f0fdf4' : '#fff',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.55 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: payMethod === m.id ? `${m.color}18` : '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.15rem',
                            color: payMethod === m.id ? m.color : '#9ca3af',
                            flexShrink: 0,
                          }}
                        >
                          {m.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{m.label}</div>
                          <div style={{ fontSize: '0.75rem', color: isDisabled ? '#b45309' : '#9ca3af' }}>{subText}</div>
                        </div>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: `2px solid ${payMethod === m.id ? '#00b14f' : '#d1d5db'}`,
                            background: payMethod === m.id ? '#00b14f' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {payMethod === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>

              {payMethod === 'stripe' && (
                <div style={{ marginBottom: 20 }}>
                  <label className="checkout-label">
                    <FaCreditCard style={{ marginRight: 4, color: '#3b82f6' }} /> Thong tin the
                  </label>
                  <div
                    style={{
                      border: '1.5px solid #d1d5db',
                      borderRadius: 12,
                      background: '#fff',
                      padding: '14px 16px',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <CardElement
                      options={CARD_ELEMENT_OPTIONS}
                      onChange={(event) => {
                        setCardError(event.error?.message || '');
                      }}
                    />
                  </div>
                  {!stripeConfigError && !stripe && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                      Dang tai cong thanh toan Stripe...
                    </div>
                  )}
                  {stripeConfigError && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 6 }}>
                      {stripeConfigError}
                    </div>
                  )}
                  {cardError && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 6 }}>
                      {cardError}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: '0.78rem',
                  color: '#92400e',
                  marginBottom: 16,
                }}
              >
                <FaShieldAlt style={{ color: '#f59e0b', flexShrink: 0 }} />
                Thanh toan duoc ma hoa SSL 256-bit. Thong tin the cua ban duoc bao mat.
              </div>

              {orderError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.8rem',
                    marginBottom: 16,
                  }}
                >
                  {orderError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="checkout-btn-back" onClick={() => setStep(1)}>← Quay lai</button>
                <button className="checkout-btn-next" onClick={handleOrder} disabled={isSubmitting}>
                  {isSubmitting ? 'Dang xu ly...' : 'Xac nhan thanh toan'} <FaCheckCircle />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-card" style={{ textAlign: 'center', padding: '50px 40px' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '2.2rem',
                  color: '#059669',
                }}
              >
                <FaCheckCircle />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827', marginBottom: 8 }}>
                Dang xu ly thanh toan...
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 0 }}>
                Vui long khong dong trang nay. Ban se duoc chuyen huong ngay.
              </p>
            </div>
          )}
        </div>

        <div className="checkout-summary">
          <h3 className="checkout-section">Tom tat don hang</h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: '#f9fafb',
              marginBottom: 14,
            }}
          >
            <MdDirectionsCar style={{ fontSize: '1.6rem', color: '#00b14f', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>{car.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{car.location || car.showroom || 'SmartRent'}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nhan xe</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>{pickupDate.replace('T', ' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tra xe</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>{returnDate.replace('T', ' ')}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [`${formatAmount(unitPrice, normalizedCurrency)} x ${days} ngay`, formatAmount(subtotalReal, normalizedCurrency)],
              ['Phi dich vu (5%)', formatAmount(serviceFee, normalizedCurrency)],
              deliveryType === 'delivery' ? ['Phi giao xe', formatAmount(deliveryFee, normalizedCurrency)] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#6b7280' }}>
                <span>{label}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{value}</span>
              </div>
            ))}

            <div
              style={{
                borderTop: '1.5px dashed #e5e7eb',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#111827',
              }}
            >
              <span>Tong cong</span>
              <span style={{ color: '#00b14f' }}>{formatAmount(totalWithDelivery, normalizedCurrency)}</span>
            </div>
          </div>

          <div
            style={{
              background: '#f0fdf4',
              borderRadius: 10,
              padding: 12,
              marginTop: 14,
              fontSize: '0.76rem',
              color: '#374151',
              lineHeight: 1.7,
            }}
          >
            Mien phi huy truoc 1 gio nhan xe<br />
            Thanh toan ma hoa an toan<br />
            Bao hiem toan dien trong chuyen di
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutContent;
