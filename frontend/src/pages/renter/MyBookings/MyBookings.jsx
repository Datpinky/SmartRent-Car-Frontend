import React, { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaFileContract, FaEye, FaComments, FaStore } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { MOCK_RENTER_BOOKINGS } from '../../../components/data/mockDashboard';
import { cars } from '../../../components/data/cars';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'active',    label: 'Đang thuê' },
  { key: 'approved',  label: 'Sắp tới' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const STATUS_COLOR = {
  active:    { bg: '#dcfce7', text: '#16a34a', label: 'Đang thuê' },
  approved:  { bg: '#dbeafe', text: '#2563eb', label: 'Sắp tới' },
  completed: { bg: '#f0f9ff', text: '#0284c7', label: 'Hoàn thành' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', label: 'Đã hủy' },
  pending:   { bg: '#fef9c3', text: '#ca8a04', label: 'Chờ xác nhận' },
};

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [detailModal, setDetailModal] = useState(null);
  const navigate = useNavigate();

  const displayed = activeTab === 'all'
    ? MOCK_RENTER_BOOKINGS
    : MOCK_RENTER_BOOKINGS.filter(b => b.status === activeTab);

  const displayedData = displayed.map(b => {
    const carData = cars.find(c => c.id === b.carId);
    return {
      ...b,
      vehicle: carData ? carData.name : b.vehicle || 'Tên xe đang cập nhật',
      image: carData ? carData.image : b.image,
      location: carData ? carData.address : b.location || 'Đang cập nhật',
      pricePerDay: carData ? carData.price * 1000 : b.pricePerDay || Math.round(b.total / b.days)
    };
  });

  const getStatusAction = (b) => {
    if (b.status === 'active')    return { label: 'Báo cáo sự cố', action: () => navigate('/renter/sos'), color: '#dc2626' };
    if (b.status === 'completed') return { label: 'Đánh giá', action: () => {}, color: '#d97706' };
    if (b.status === 'approved')  return { label: 'Xem chi tiết', action: () => setDetailModal(b), color: '#2563eb' };
    return null;
  };

  return (
    <div className="my-bookings">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Chuyến đi của tôi</h1>
          <p className="page-subtitle">Lịch sử và trạng thái đặt xe</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/')}>+ Đặt xe mới</button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng chuyến', val: MOCK_RENTER_BOOKINGS.length, color: '#374151' },
          { label: 'Đang thuê',   val: MOCK_RENTER_BOOKINGS.filter(b => b.status === 'active').length,    color: '#16a34a' },
          { label: 'Hoàn thành',  val: MOCK_RENTER_BOOKINGS.filter(b => b.status === 'completed').length, color: '#0284c7' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 18px', border: '1px solid #f0f0f0', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="booking-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => {
          const count = t.key === 'all'
            ? MOCK_RENTER_BOOKINGS.length
            : MOCK_RENTER_BOOKINGS.filter(b => b.status === t.key).length;
          return (
            <button
              key={t.key}
              className={`booking-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label} {count > 0 && <span className="booking-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {displayedData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af', background: '#fff', borderRadius: 16 }}>
          <MdDirectionsCar style={{ fontSize: '3.5rem', marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600 }}>Không có chuyến đi nào</div>
        </div>
      )}

      {/* Car card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {displayedData.map(b => {
          const action = getStatusAction(b);
          const sc = STATUS_COLOR[b.status] || STATUS_COLOR.pending;
          return (
            <div
              key={b.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                border: '1px solid #f0f0f0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
            >
              {/* Car image */}
              <div style={{ position: 'relative', height: 180, background: '#f8fafc', overflow: 'hidden' }}>
                {b.image ? (
                  <img
                    src={b.image}
                    alt={b.vehicle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{
                  display: b.image ? 'none' : 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: '#cbd5e1', fontSize: '4rem'
                }}>
                  <MdDirectionsCar />
                </div>

                {/* Status badge overlay */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  background: sc.bg, color: sc.text,
                  fontSize: '0.7rem', fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                  border: `1px solid ${sc.text}30`,
                }}>
                  {sc.label}
                </div>

                {/* Price per day badge */}
                {b.pricePerDay && (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    {b.pricePerDay.toLocaleString()}đ/ngày
                  </div>
                )}
              </div>

              {/* Card body */}
              <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Title */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>{b.vehicle}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
                    <FaStore size={11} /> {b.showroom}
                  </div>
                </div>

                {/* Info pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.73rem', color: '#6b7280', background: '#f9fafb', padding: '3px 8px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <FaCalendarAlt size={10} /> {b.from} → {b.to}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.73rem', color: '#6b7280', background: '#f9fafb', padding: '3px 8px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <FaClock size={10} /> {b.days} ngày
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.73rem', color: '#6b7280', background: '#f9fafb', padding: '3px 8px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <FaMapMarkerAlt size={10} /> {b.location}
                  </span>
                </div>

                {/* Footer: total + actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#87ceeb' }}>{b.total.toLocaleString()}đ</div>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Mã: {b.id}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn-icon" onClick={() => setDetailModal(b)} title="Chi tiết"><FaEye /></button>
                    {b.contractId && <button className="btn-icon" title="Hợp đồng"><FaFileContract /></button>}
                    <button className="btn-icon" title="Liên hệ"><FaComments /></button>
                    {action && (
                      <button
                        style={{ background: action.color, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onClick={action.action}
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiết chuyến đi" width={480}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {detailModal.image && (
              <img src={detailModal.image} alt={detailModal.vehicle} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
            )}
            <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{detailModal.vehicle}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 3 }}>{detailModal.showroom}</div>
            </div>
            {[
              ['Mã đặt xe',    detailModal.id],
              ['Ngày nhận xe', detailModal.from],
              ['Ngày trả xe',  detailModal.to],
              ['Số ngày thuê', detailModal.days + ' ngày'],
              ['Tổng tiền',    detailModal.total.toLocaleString() + 'đ'],
              ['Thanh toán',   detailModal.payStatus],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
            {detailModal.contractId && (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <FaFileContract /> Xem hợp đồng điện tử
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookings;
