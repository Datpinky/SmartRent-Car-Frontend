import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCreditCard,
  FaEnvelope,
  FaMoneyBillWave,
  FaSpinner,
  FaSyncAlt,
} from 'react-icons/fa';
import bookingService from '../../../services/bookingService';
import paymentService from '../../../services/paymentService';
import {
  formatDateTime,
  formatMoney,
  mapRenterBooking,
  PAYMENT_LABELS,
} from '../../../utils/renterBookingView';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY, {
  developerTools: {
    assistant: {
      enabled: process.env.REACT_APP_STRIPE_TESTING_ASSISTANT === 'true',
    },
  },
});

const buildRetrySessionError = (message = '') => {
  const normalized = String(message || '').toLowerCase();
  const looksExpiredSession =
    normalized.includes('client secret')
    || normalized.includes('payment intent')
    || normalized.includes('elements session')
    || normalized.includes('invalid')
    || normalized.includes('expired')
    || normalized.includes('loaderror');

  return looksExpiredSession
    ? 'Phien thanh toan hien tai khong con hop le tren Stripe. Vui long tao lai phien thanh toan moi.'
    : 'Cong thanh toan Stripe khong tai duoc day du. Vui long tao lai phien thanh toan va thu lai.';
};

const StripeRetryForm = ({ bookingId, onError, onSessionBroken }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement || !paymentElementReady) {
      onError('Cong thanh toan chua san sang. Vui long doi trong giay lat roi thu lai.');
      return;
    }

    setSubmitting(true);
    onError('');

    try {
      const returnUrl = `${window.location.origin}/renter/payment-result?bookingId=${bookingId}`;
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
      });

      if (error) {
        onError(error.message || 'Khong the tiep tuc thanh toan luc nay.');
        setSubmitting(false);
      }
    } catch (error) {
      onError(error?.message || 'Khong the tiep tuc thanh toan luc nay.');
      setSubmitting(false);
    }
  };

  const handleLoadError = (event) => {
    setPaymentElementReady(false);
    onSessionBroken(buildRetrySessionError(event?.error?.message || event?.message || ''));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 16,
          background: '#fff',
          marginBottom: 18,
        }}
      >
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'never', googlePay: 'never' },
          }}
          onLoaderStart={() => setPaymentElementReady(false)}
          onReady={() => setPaymentElementReady(true)}
          onLoaderror={handleLoadError}
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', minHeight: 46 }}
        disabled={!stripe || submitting || !paymentElementReady}
      >
        {submitting ? (
          <>
            <FaSpinner className="animate-spin" /> Dang xu ly...
          </>
        ) : (
          <>
            <FaCreditCard /> {paymentElementReady ? 'Thanh toan lai ngay' : 'Dang tai cong thanh toan...'}
          </>
        )}
      </button>
    </form>
  );
};

const RetryPayment = () => {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [needsNewSession, setNeedsNewSession] = useState(false);

  const autoPreparedRef = useRef('');

  const renterBooking = useMemo(
    () => (booking ? mapRenterBooking(booking) : null),
    [booking]
  );

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setError('Khong tim thay booking de thanh toan lai.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data || null);
      setError('');
    } catch (err) {
      setBooking(null);
      setError(err.message || 'Khong the tai thong tin booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleRefreshBooking = useCallback(async () => {
    autoPreparedRef.current = '';
    setClientSecret('');
    setNeedsNewSession(false);
    setError('');
    await loadBooking();
  }, [loadBooking]);

  const prepareRetryPayment = useCallback(async (targetBooking = renterBooking) => {
    if (!targetBooking?.id) {
      setError('Khong tim thay booking de tao lai phien thanh toan.');
      return;
    }

    setPreparing(true);
    setError('');
    setNeedsNewSession(false);

    try {
      const paymentData = await paymentService.retryPaymentSession(
        targetBooking.id,
        Number(targetBooking.totalPrice || 0)
      );
      const secret = paymentData?.client_secret || paymentData?.clientSecret || '';

      if (!secret) {
        throw new Error('Khong nhan duoc client secret de tiep tuc thanh toan.');
      }

      setClientSecret(secret);
    } catch (err) {
      setClientSecret('');
      setNeedsNewSession(true);
      setError(err.message || 'Khong the tao lai phien thanh toan cho booking nay.');
    } finally {
      setPreparing(false);
    }
  }, [renterBooking]);

  useEffect(() => {
    if (!renterBooking?.id || !renterBooking.canRetryPayment || clientSecret) {
      return;
    }

    if (autoPreparedRef.current === renterBooking.id) {
      return;
    }

    autoPreparedRef.current = renterBooking.id;
    void prepareRetryPayment(renterBooking);
  }, [clientSecret, prepareRetryPayment, renterBooking]);

  const stripeOptions = useMemo(
    () => (clientSecret
      ? {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#00b14f' },
        },
      }
      : undefined),
    [clientSecret]
  );

  const retryBlockedMessage = !renterBooking
    ? ''
    : renterBooking.paymentStatus === 'successful'
      ? 'Booking nay da thanh toan thanh cong, khong can tao lai phien thanh toan.'
      : renterBooking.status === 'cancelled'
        ? 'Booking da bi huy, khong the thanh toan lai.'
        : 'Booking nay khong o trang thai cho phep thanh toan lai.';

  const sessionRecoveryHint = needsNewSession
    ? 'Stripe khong the dung phien hien tai. Ban can tao lai phien thanh toan moi cho booking nay.'
    : 'Chua khoi tao duoc phien thanh toan moi. Ban co the thu tao lai phien Stripe cho booking nay.';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', color: '#6b7280', gap: 10 }}>
        <FaSpinner className="animate-spin" />
        Dang tai thong tin thanh toan...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0 28px' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title">Thanh toan lai</h1>
            <p className="page-subtitle">Mo lai phien Stripe cho booking dang cho thanh toan hoac can retry</p>
          </div>
          <button className="renter-btn-soft" onClick={() => navigate('/renter/pending-payments')}>
            <FaArrowLeft /> Cho thanh toan
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: '0.84rem',
            }}
          >
            {error}
          </div>
        )}

        {!renterBooking ? (
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24 }}>
            Khong tim thay booking de thanh toan lai.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>{renterBooking.vehicleName}</div>
                  <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#6b7280' }}>{renterBooking.showroomName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#00b14f' }}>
                    {formatMoney(renterBooking.totalPrice)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#6b7280' }}>Ma booking: {renterBooking.id}</div>
                </div>
              </div>

              <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                {[
                  ['Trang thai booking', renterBooking.status],
                  ['Trang thai thanh toan', PAYMENT_LABELS[renterBooking.paymentStatus] || renterBooking.paymentStatus],
                  ['Thoi gian nhan xe', formatDateTime(renterBooking.startDate)],
                  ['Thoi gian tra xe', formatDateTime(renterBooking.endDate)],
                  ['Phuong thuc', renterBooking.paymentMethod],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingBottom: 10,
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 16,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 800, color: '#111827', marginBottom: 8 }}>{renterBooking.statusHeadline}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.65, marginBottom: 8 }}>
                  {renterBooking.waitingForLabel}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 700, marginBottom: 6 }}>
                  {renterBooking.waitingOwnerLabel}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
                  Buoc tiep theo: {renterBooking.nextStepLabel}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#0f766e', lineHeight: 1.6 }}>
                  Viec ban nen lam: {renterBooking.renterActionHint}
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaMoneyBillWave />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#111827' }}>Phien thanh toan Stripe</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                    FE se mo lai phien thanh toan cho chinh booking nay. Neu Stripe bao phien khong hop le, ban co the tao lai phien moi ngay tai day.
                  </div>
                </div>
              </div>

              {!renterBooking.canRetryPayment ? (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '14px 16px',
                    color: '#475569',
                    fontSize: '0.84rem',
                    lineHeight: 1.6,
                  }}
                >
                  {retryBlockedMessage}
                </div>
              ) : clientSecret ? (
                <>
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      color: '#166534',
                      borderRadius: 12,
                      padding: '12px 14px',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    <FaCheckCircle style={{ marginRight: 6 }} />
                    Da san sang mo lai cong thanh toan cho booking nay. Neu cong Stripe khong tai duoc, FE se dua ban ve thao tac tao lai phien moi.
                  </div>
                  <Elements stripe={stripePromise} options={stripeOptions} key={clientSecret}>
                    <StripeRetryForm
                      bookingId={renterBooking.id}
                      onError={setError}
                      onSessionBroken={(message) => {
                        setClientSecret('');
                        setNeedsNewSession(true);
                        setError(message);
                      }}
                    />
                  </Elements>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fcd34d',
                      color: '#92400e',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                  }}
                >
                    {sessionRecoveryHint}
                  </div>
                  <button
                    className="btn-primary"
                    style={{ justifyContent: 'center' }}
                    onClick={() => prepareRetryPayment(renterBooking)}
                    disabled={preparing}
                  >
                    {preparing ? (
                      <>
                        <FaSpinner className="animate-spin" /> Dang tao lai phien thanh toan...
                      </>
                    ) : (
                      <>
                        <FaCreditCard /> Tao lai phien thanh toan
                      </>
                    )}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <button className="renter-btn-soft" onClick={() => navigate('/renter/pending-payments')}>
                  <FaArrowLeft /> Quay ve Cho thanh toan
                </button>
                <button className="renter-btn-soft" onClick={handleRefreshBooking} disabled={loading || preparing}>
                  <FaSyncAlt /> Kiem tra lai trang thai booking
                </button>
                {renterBooking.showroomEmail && (
                  <a className="renter-btn-soft" href={`mailto:${renterBooking.showroomEmail}`}>
                    <FaEnvelope /> Lien he showroom
                  </a>
                )}
                <button className="renter-btn-soft" onClick={() => navigate(`/renter/payment-result?bookingId=${renterBooking.id}&status=pending`)}>
                  Xem payment result
                </button>
                <button className="renter-btn-soft" onClick={() => navigate('/renter/transactions')}>
                  Lich su giao dich
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetryPayment;
