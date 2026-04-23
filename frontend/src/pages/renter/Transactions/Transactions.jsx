import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaEye,
    FaMoneyBillWave,
} from 'react-icons/fa';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import bookingService from '../../../services/bookingService';
import { sanitizeImageList } from '../../../utils/media';

const FILTERS = [
    { key: 'all', label: 'Tat ca' },
    { key: 'successful', label: 'Thanh cong' },
    { key: 'pending', label: 'Cho xu ly' },
    { key: 'failed', label: 'That bai / tu choi' },
];

/** Trạng thái booking không hiển thị trong lịch sử giao dịch. */
const EXCLUDED_BOOKING_STATUSES = ['pending', 'waiting_payment', 'cancelled'];

const PAYMENT_LABELS = {
    pending: 'Cho thanh toan',
    successful: 'Thanh cong',
    failed: 'That bai',
    declined: 'Bi tu choi',
};

const formatDateTime = (value) => {
    if (!value) {
        return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toLocaleString('vi-VN');
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const mapTransaction = (booking) => {
    const payment = booking.payment || null;
    const images = sanitizeImageList([
        ...(booking.vehicle?.images || []),
        ...(booking.vehicle_id?.vehicle_images_paths || []),
        ...(booking.vehicle_id?.images || []),
    ]);

    const paymentStatus =
        payment?.payment_status
        || booking.paymentState?.paymentStatus
        || (booking.status === 'paid' ? 'successful' : 'pending');

    return {
        id: payment?._id || booking._id,
        bookingId: booking._id,
        vehicleName: booking.vehicle?.name || booking.vehicle_id?.vehicle_name || 'Xe khong ten',
        showroomName: booking.showroom?.name || booking.showroom_id?.name || 'SmartRent',
        amount: payment?.amount || booking.total_price || 0,
        method: payment?.payment_method || 'Chua co',
        status: paymentStatus,
        transactionCode: payment?.transaction_code || payment?.stripe_payment_intent_id || '',
        paidAt: payment?.paid_at || '',
        createdAt: payment?.createdAt || booking.createdAt || '',
        bookingStatus: booking.status,
        image: images[0] || '',
        raw: booking,
    };
};

const matchFilter = (transaction, activeFilter) => {
    if (activeFilter === 'all') {
        return true;
    }

    if (activeFilter === 'failed') {
        return ['failed', 'declined'].includes(transaction.status);
    }

    return transaction.status === activeFilter;
};

const Transactions = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [detailModal, setDetailModal] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadTransactions = async () => {
            setLoading(true);
            try {
                const bookings = await bookingService.getMyBookingsDetailed();
                if (!mounted) {
                    return;
                }

                const validBookings = (bookings || []).filter(
                    (b) => !EXCLUDED_BOOKING_STATUSES.includes(b.status)
                );
                setTransactions(validBookings.map(mapTransaction));
                setError('');
            } catch (err) {
                if (!mounted) {
                    return;
                }

                setTransactions([]);
                setError(err.message || 'Khong the tai lich su giao dich.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadTransactions();
        return () => {
            mounted = false;
        };
    }, []);

    const filteredTransactions = useMemo(
        () => transactions.filter((transaction) => matchFilter(transaction, activeFilter)),
        [activeFilter, transactions]
    );

    const summary = useMemo(
        () => ({
            total: transactions.length,
            successful: transactions.filter((transaction) => transaction.status === 'successful').length,
            pending: transactions.filter((transaction) => transaction.status === 'pending').length,
            totalPaid: transactions
                .filter((transaction) => transaction.status === 'successful')
                .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
        }),
        [transactions]
    );

    return (
        <div>
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <h1 className="page-title">Lich su giao dich</h1>
                    <p className="page-subtitle">Tong hop payment tu booking va payment record cua renter</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/renter/bookings')}>
                    Xem booking
                </button>
            </div>

            {error && (
                <div style={{ marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '12px 14px', fontSize: '0.84rem' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                    { label: 'Tong giao dich', value: summary.total, color: '#111827' },
                    { label: 'Thanh cong', value: summary.successful, color: '#059669' },
                    { label: 'Cho xu ly', value: summary.pending, color: '#d97706' },
                    { label: 'Da thu', value: formatMoney(summary.totalPaid), color: '#2563eb' },
                ].map((item) => (
                    <div key={item.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '12px 18px', minWidth: 140 }}>
                        <div style={{ fontSize: item.label === 'Da thu' ? '1.1rem' : '1.35rem', fontWeight: 800, color: item.color }}>
                            {item.value}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: 2 }}>{item.label}</div>
                    </div>
                ))}
            </div>

            <div className="booking-tabs" style={{ marginBottom: 18 }}>
                {FILTERS.map((filter) => {
                    const count = transactions.filter((transaction) => matchFilter(transaction, filter.key)).length;
                    return (
                        <button
                            key={filter.key}
                            className={`booking-tab ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {filter.label}
                            {count > 0 && <span className="booking-tab-count">{count}</span>}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '56px 0', color: '#6b7280' }}>Dang tai giao dich...</div>
            ) : filteredTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px 0', color: '#9ca3af', background: '#fff', borderRadius: 16 }}>
                    <FaMoneyBillWave style={{ fontSize: '2.8rem', opacity: 0.25, marginBottom: 12 }} />
                    <div>Chua co giao dich nao trong nhom nay</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredTransactions.map((transaction) => (
                        <div
                            key={`${transaction.id}-${transaction.bookingId}`}
                            style={{
                                background: '#fff',
                                borderRadius: 18,
                                border: '1px solid #f0f0f0',
                                padding: 18,
                                display: 'grid',
                                gridTemplateColumns: '88px 1fr auto',
                                gap: 16,
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ width: 88, height: 68, borderRadius: 12, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {transaction.image ? (
                                    <img src={transaction.image} alt={transaction.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <FaCarFallback />
                                )}
                            </div>

                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{transaction.vehicleName}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>{transaction.showroomName}</div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.77rem', color: '#6b7280' }}>
                                        <FaCreditCard size={11} /> {transaction.method}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.77rem', color: '#6b7280' }}>
                                        <FaCalendarAlt size={11} /> {formatDateTime(transaction.createdAt)}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.77rem', color: '#6b7280' }}>
                                        <FaClock size={11} /> {transaction.paidAt ? formatDateTime(transaction.paidAt) : 'Chua ghi nhan paid_at'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: 8 }}>
                                    <StatusBadge
                                        status={transaction.status}
                                        customLabel={PAYMENT_LABELS[transaction.status] || transaction.status}
                                    />
                                </div>
                                <div style={{ fontWeight: 800, color: '#00b14f', fontSize: '1rem' }}>
                                    {formatMoney(transaction.amount)}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Booking: {transaction.bookingId}</div>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    style={{ marginLeft: 'auto', marginTop: 10 }}
                                    onClick={() => setDetailModal(transaction)}
                                    title="Chi tiet giao dich"
                                >
                                    <FaEye />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiet giao dich" width={560}>
                {detailModal && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ background: '#f9fafb', borderRadius: 14, padding: 16 }}>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>{detailModal.vehicleName}</div>
                            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{detailModal.showroomName}</div>
                        </div>

                        {[
                            ['Booking ID', detailModal.bookingId],
                            ['Trang thai booking', detailModal.bookingStatus],
                            ['Trang thai payment', PAYMENT_LABELS[detailModal.status] || detailModal.status],
                            ['Phuong thuc', detailModal.method],
                            ['So tien', formatMoney(detailModal.amount)],
                            ['Tao luc', formatDateTime(detailModal.createdAt)],
                            ['Paid at', formatDateTime(detailModal.paidAt)],
                            ['Ma giao dich', detailModal.transactionCode || 'Chua co'],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{label}</span>
                                <span style={{ color: '#111827', fontWeight: 600, fontSize: '0.82rem', textAlign: 'right' }}>{value}</span>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() =>
                                    navigate(
                                        `/renter/payment-result?bookingId=${detailModal.bookingId}&status=${detailModal.status === 'successful'
                                            ? 'success'
                                            : detailModal.status === 'pending'
                                                ? 'pending'
                                                : 'error'
                                        }`
                                    )
                                }
                            >
                                <FaCheckCircle /> Xem payment result
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => navigate('/renter/bookings')}
                            >
                                Xem booking
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const FaCarFallback = () => (
    <div style={{ color: '#00b14f', fontSize: '1.8rem' }}>
        <FaMoneyBillWave />
    </div>
);

export default Transactions;