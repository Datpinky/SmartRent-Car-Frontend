import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaUndoAlt,
} from 'react-icons/fa';
import StatusBadge from '../../../components/common/StatusBadge';
import bookingService from '../../../services/bookingService';
import { getBookingPaymentStatus } from '../../../utils/bookingFlowState';
import { formatDateTime, formatMoney, PAYMENT_LABELS } from '../../../utils/renterBookingView';
import { sanitizeImageList } from '../../../utils/media';

const PAYMENT_VISUALS = {
  successful: { label: 'Da ghi nhan', bg: '#dcfce7', color: '#166534' },
  refunded: { label: 'Da hoan tra', bg: '#dbeafe', color: '#1d4ed8' },
  refund_pending: { label: 'Dang xu ly hoan tra', bg: '#dbeafe', color: '#1d4ed8' },
  pending: { label: 'Cho thanh toan', bg: '#fef3c7', color: '#b45309' },
  failed: { label: 'That bai', bg: '#fee2e2', color: '#b91c1c' },
  declined: { label: 'Bi tu choi', bg: '#fee2e2', color: '#b91c1c' },
};

const SUMMARY_CARD_CONFIG = [
  {
    key: 'recordedAmount',
    label: 'Tien dat xe da ghi nhan',
    icon: FaMoneyBillWave,
    accent: '#059669',
    tint: 'rgba(5, 150, 105, 0.12)',
  },
  {
    key: 'refundTrackingAmount',
    label: 'Hoan tra da ghi nhan / dang xu ly',
    icon: FaUndoAlt,
    accent: '#2563eb',
    tint: 'rgba(37, 99, 235, 0.12)',
  },
  {
    key: 'refundTrackingCount',
    label: 'Booking theo doi hoan tra',
    icon: FaReceipt,
    accent: '#7c3aed',
    tint: 'rgba(124, 58, 237, 0.12)',
  },
  {
    key: 'pendingAmount',
    label: 'So tien cho thanh toan',
    icon: FaClock,
    accent: '#d97706',
    tint: 'rgba(217, 119, 6, 0.12)',
  },
];

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timestampOf = (value) => (value instanceof Date ? value.getTime() : 0);

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getMonthLabel = (date) => `T${date.getMonth() + 1}/${date.getFullYear()}`;

const createRecentMonthBuckets = (count = 6) => {
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - (count - index - 1), 1);
    return {
      key: getMonthKey(date),
      label: getMonthLabel(date),
    };
  });
};

const getPaymentVisual = (item) => {
  if (item.refundCompleted) {
    return PAYMENT_VISUALS.refunded;
  }

  if (item.refundPending) {
    return PAYMENT_VISUALS.refund_pending;
  }

  return PAYMENT_VISUALS[item.paymentStatus] || {
    label: PAYMENT_LABELS[item.paymentStatus] || item.paymentStatus || 'N/A',
    bg: '#f3f4f6',
    color: '#4b5563',
  };
};

const resolveFinanceItem = (booking) => {
  const payment = booking.payment || null;
  const paymentStatus = getBookingPaymentStatus(booking);
  const amount = Number(payment?.amount || booking.total_price || 0);
  const createdAt =
    parseDate(payment?.createdAt)
    || parseDate(booking.createdAt)
    || parseDate(booking.start_date)
    || new Date();
  const paidAt =
    parseDate(payment?.paid_at)
    || parseDate(payment?.updatedAt)
    || parseDate(booking.updatedAt)
    || createdAt;
  const updatedAt = parseDate(booking.updatedAt) || parseDate(payment?.updatedAt) || paidAt;
  const paymentRecorded = ['successful', 'refunded'].includes(paymentStatus);
  const refundPending = booking.status === 'cancelled' && paymentStatus === 'successful';
  const refundCompleted = paymentStatus === 'refunded';
  const pendingPayment = paymentStatus === 'pending' && booking.status !== 'cancelled';
  const images = sanitizeImageList([
    ...(booking.vehicle?.images || []),
    ...(booking.vehicle_id?.vehicle_images_paths || []),
    ...(booking.vehicle_id?.images || []),
  ]);

  return {
    id: payment?._id || booking._id,
    bookingId: booking._id,
    vehicleName: booking.vehicle?.name || booking.vehicle_id?.vehicle_name || 'Xe khong ten',
    showroomName: booking.showroom?.name || booking.showroom_id?.name || 'SmartRent',
    amount,
    status: booking.status,
    paymentStatus,
    paymentMethod: payment?.payment_method || 'Chua co',
    transactionCode: payment?.transaction_code || payment?.stripe_payment_intent_id || '',
    createdAt,
    paidAt,
    updatedAt,
    timelineDate: updatedAt || paidAt || createdAt,
    paymentRecorded,
    refundPending,
    refundCompleted,
    hasRefundActivity: refundPending || refundCompleted,
    pendingPayment,
    image: images[0] || '',
    refundHint: refundCompleted
      ? 'Khoan hoan tra da duoc ghi nhan tren he thong.'
      : refundPending
        ? 'Booking da huy sau khi thanh toan thanh cong. FE dang theo doi de doi chieu hoan tra.'
        : pendingPayment
          ? 'Booking nay chua co payment thanh cong.'
          : 'Khoan tien da duoc ghi nhan tren he thong.',
  };
};

const cardValue = (key, summary) => {
  if (key === 'refundTrackingCount') {
    return summary[key];
  }

  return formatMoney(summary[key]);
};

const cardHint = (key, summary) => {
  if (key === 'recordedAmount') {
    return `${summary.recordedCount} booking da ghi nhan payment`;
  }

  if (key === 'refundTrackingAmount') {
    if (!summary.refundTrackingCount) {
      return 'Chua co booking nao can theo doi hoan tra';
    }

    if (summary.refundPendingCount && summary.refundCompletedCount) {
      return `${summary.refundCompletedCount} da hoan tra, ${summary.refundPendingCount} dang xu ly`;
    }

    if (summary.refundCompletedCount) {
      return `${summary.refundCompletedCount} booking da hoan tra`;
    }

    return `${summary.refundPendingCount} booking dang xu ly hoan tra`;
  }

  if (key === 'refundTrackingCount') {
    if (!summary.refundTrackingCount) {
      return 'Chua co yeu cau hoan tra nao can theo doi';
    }

    if (summary.refundCompletedCount && summary.refundPendingCount) {
      return 'Bao gom booking da hoan tra va booking dang xu ly';
    }

    if (summary.refundCompletedCount) {
      return 'Tat ca booking trong nhom nay da hoan tra';
    }

    return 'Mo danh sach ben duoi de xem tung booking';
  }

  return summary.pendingCount
    ? `${summary.pendingCount} booking van dang cho thanh toan`
    : 'Khong co booking nao dang cho thanh toan';
};

const PaymentPill = ({ item }) => {
  const visual = getPaymentVisual(item);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        background: visual.bg,
        color: visual.color,
        whiteSpace: 'nowrap',
      }}
    >
      {visual.label}
    </span>
  );
};

const EmptyPanel = ({ title, description }) => (
  <div
    style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px dashed #d1d5db',
      borderRadius: 18,
      padding: 24,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#111827' }}>{title}</div>
    <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 6 }}>{description}</div>
  </div>
);

const RenterDashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const bookings = await bookingService.getMyBookingsDetailed();
        if (!mounted) {
          return;
        }

        setItems((bookings || []).map(resolveFinanceItem));
        setError('');
      } catch (err) {
        if (!mounted) {
          return;
        }

        setItems([]);
        setError(err.message || 'Khong the tai du lieu tai chinh.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const recordedItems = items.filter((item) => item.paymentRecorded);
    const refundItems = items.filter((item) => item.hasRefundActivity);
    const refundPendingItems = items.filter((item) => item.refundPending);
    const refundCompletedItems = items.filter((item) => item.refundCompleted);
    const pendingItems = items.filter((item) => item.pendingPayment);

    return {
      recordedAmount: recordedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      refundTrackingAmount: refundItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      refundTrackingCount: refundItems.length,
      pendingAmount: pendingItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      recordedCount: recordedItems.length,
      refundPendingCount: refundPendingItems.length,
      refundCompletedCount: refundCompletedItems.length,
      pendingCount: pendingItems.length,
    };
  }, [items]);

  const chartData = useMemo(() => {
    const monthBuckets = createRecentMonthBuckets(6);
    const bucketMap = new Map(
      monthBuckets.map((bucket) => [
        bucket.key,
        {
          name: bucket.label,
          bookedAmount: 0,
          refundAmount: 0,
          pendingAmount: 0,
        },
      ])
    );

    items.forEach((item) => {
      const timelineDate = item.timelineDate || item.createdAt;
      if (!timelineDate) {
        return;
      }

      const bucket = bucketMap.get(getMonthKey(timelineDate));
      if (!bucket) {
        return;
      }

      if (item.paymentRecorded) {
        bucket.bookedAmount += Number(item.amount || 0);
      }

      if (item.hasRefundActivity) {
        bucket.refundAmount += Number(item.amount || 0);
      }

      if (item.pendingPayment) {
        bucket.pendingAmount += Number(item.amount || 0);
      }
    });

    return monthBuckets.map((bucket) => bucketMap.get(bucket.key));
  }, [items]);

  const refundCases = useMemo(
    () => [...items]
      .filter((item) => item.hasRefundActivity)
      .sort((left, right) => timestampOf(right.timelineDate) - timestampOf(left.timelineDate)),
    [items]
  );

  const recentItems = useMemo(
    () => [...items]
      .sort((left, right) => timestampOf(right.timelineDate) - timestampOf(left.timelineDate))
      .slice(0, 6),
    [items]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 55%, #ffffff 100%)',
          border: '1px solid #dbeafe',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#111827' }}>
            Tong quan tien dat xe va hoan tra
          </div>
          <div style={{ fontSize: '0.92rem', color: '#4b5563', marginTop: 8, lineHeight: 1.65 }}>
            Dashboard nay tong hop tien dat xe da ghi nhan, cac booking huy co lien quan den hoan tra,
            va nhung khoan van dang cho thanh toan. Hien FE dang doi chieu hoan tra theo trang thai
            booking va payment hien co. Khi backend co them trang thai refund rieng, so lieu se duoc
            tach ro hon.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/renter/transactions')}
          >
            <FaExchangeAlt /> Lich su giao dich
          </button>
          <button
            type="button"
            className="renter-btn-soft"
            onClick={() => navigate('/renter/bookings')}
          >
            <FaArrowRight /> Chuyen di cua toi
          </button>
        </div>
      </section>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 16,
            padding: '14px 16px',
            fontSize: '0.86rem',
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {SUMMARY_CARD_CONFIG.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              style={{
                background: '#ffffff',
                borderRadius: 22,
                border: '1px solid #edf2f7',
                padding: 20,
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: card.key === 'refundTrackingCount' ? '1.8rem' : '1.55rem',
                      fontWeight: 900,
                      color: '#111827',
                      marginTop: 10,
                    }}
                  >
                    {loading ? '...' : cardValue(card.key, summary)}
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: card.tint,
                    color: card.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  <Icon />
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 12, lineHeight: 1.55 }}>
                {loading ? 'Dang tong hop du lieu...' : cardHint(card.key, summary)}
              </div>
            </div>
          );
        })}
      </section>

      <section
        style={{
          background: '#ffffff',
          borderRadius: 24,
          border: '1px solid #edf2f7',
          padding: 22,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#111827' }}>
              Dong tien 6 thang gan day
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
              Xanh la: da ghi nhan. Xanh duong: da hoan tra hoac dang xu ly. Cam: cho thanh toan.
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: '#f8fafc',
              color: '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <FaCalendarAlt /> Cap nhat theo booking / payment hien co
          </div>
        </div>

        <div style={{ width: '100%', height: 320, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(Number(value || 0) / 1000000)}tr`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                formatter={(value) => formatMoney(value)}
                labelStyle={{ fontWeight: 700, color: '#0f172a' }}
              />
              <Bar dataKey="bookedAmount" name="Da ghi nhan" fill="#00b14f" radius={[8, 8, 0, 0]} />
              <Bar dataKey="refundAmount" name="Hoan tra / dang xu ly" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pendingAmount" name="Cho thanh toan" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-[18px] xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div
          style={{
            background: '#ffffff',
            borderRadius: 24,
            border: '1px solid #edf2f7',
            padding: 22,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: '1.02rem', fontWeight: 900, color: '#111827' }}>
                Theo doi hoan tra
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
                Bao gom booking da huy co payment da ghi nhan. FE dang nhom chung cac truong hop da hoan tra
                va dang xu ly de renter de theo doi.
              </div>
            </div>
            <button
              type="button"
              className="renter-btn-soft"
              onClick={() => navigate('/renter/transactions')}
            >
              <FaExchangeAlt /> Xem payment
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
              Dang tai dashboard...
            </div>
          ) : refundCases.length === 0 ? (
            <EmptyPanel
              title="Chua co booking nao can theo doi hoan tra"
              description="Khi booking bi huy sau khi da co payment ghi nhan, muc nay se hien de renter theo doi."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {refundCases.map((item) => (
                <div
                  key={`${item.bookingId}-refund`}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 18,
                    padding: 16,
                    display: 'grid',
                    gridTemplateColumns: '82px minmax(0, 1fr)',
                    gap: 14,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 82,
                      height: 70,
                      borderRadius: 14,
                      background: item.image ? '#e5e7eb' : 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontWeight: 800,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.vehicleName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      'REF'
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#111827' }}>{item.vehicleName}</div>
                      <StatusBadge status={item.status} />
                      <PaymentPill item={item} />
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{item.showroomName}</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b' }}>
                        <FaMoneyBillWave size={11} /> {formatMoney(item.amount)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b' }}>
                        <FaCalendarAlt size={11} /> {formatDateTime(item.updatedAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: item.refundCompleted ? '#ecfdf5' : '#eff6ff',
                        color: item.refundCompleted ? '#166534' : '#1d4ed8',
                        fontSize: '0.8rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {item.refundHint}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      <button
                        type="button"
                        className="renter-btn-soft"
                        onClick={() => navigate('/renter/bookings')}
                      >
                        Mo booking
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate('/renter/transactions')}
                      >
                        Xem payment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 24,
            border: '1px solid #edf2f7',
            padding: 22,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '1.02rem', fontWeight: 900, color: '#111827' }}>
            Giao dich gan day
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4, marginBottom: 16 }}>
            Cac booking va payment moi nhat duoc FE tong hop tai day de renter doi chieu nhanh.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
              Dang tai lich su...
            </div>
          ) : recentItems.length === 0 ? (
            <EmptyPanel
              title="Chua co dong tien nao"
              description="Khi renter tao booking va thanh toan, dashboard se hien cac muc tong hop tai day."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentItems.map((item) => (
                <div
                  key={`${item.bookingId}-${item.id}`}
                  style={{
                    border: '1px solid #eef2f7',
                    borderRadius: 16,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>{item.vehicleName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>{item.showroomName}</div>
                    </div>
                    <PaymentPill item={item} />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <StatusBadge status={item.status} />
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Booking: {item.bookingId}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.77rem', color: '#64748b' }}>
                        <FaReceipt size={11} /> {item.paymentMethod}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.77rem', color: '#64748b' }}>
                        <FaCalendarAlt size={11} /> {formatDateTime(item.timelineDate)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: item.hasRefundActivity ? '#2563eb' : '#00b14f' }}>
                        {formatMoney(item.amount)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                        {item.transactionCode || 'Chua co ma giao dich'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RenterDashboard;
