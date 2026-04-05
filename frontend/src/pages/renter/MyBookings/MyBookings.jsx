import React, { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaFileContract, FaEye, FaComments, FaSignature } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { MOCK_RENTER_BOOKINGS } from '../../../components/data/mockDashboard';
import { getContractById } from '../../../components/data/contractHelpers';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'active',    label: 'Đang thuê' },
  { key: 'approved',  label: 'Sắp tới' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [detailModal, setDetailModal] = useState(null);
  const navigate = useNavigate();

  const displayed = activeTab === 'all' ? MOCK_RENTER_BOOKINGS : MOCK_RENTER_BOOKINGS.filter(b => b.status === activeTab);

  const getStatusAction = (b) => {
    if (b.status === 'active') return { label: 'Báo cáo sự cố', action: () => navigate('/renter/sos'), color: '#dc2626' };
    if (b.status === 'completed') return { label: 'Đánh giá', action: () => {}, color: '#d97706' };
    if (b.status === 'approved') return { label: 'Xem chi tiết', action: () => setDetailModal(b), color: '#2563eb' };
    return null;
  };

  const getContractAction = (b) => {
    if (!b.contractId) return null;
    const c = getContractById(b.contractId);
    if (!c) return null;
    const needsSign = c.status === 'pending_renter_sign' && !c.renterSig;
    return { contractId: b.contractId, needsSign };
  };

  return (
    <div className="my-bookings">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div><h1 className="page-title">Chuyến đi của tôi</h1><p className="page-subtitle">Lịch sử và trạng thái đặt xe</p></div>
        <button className="btn-primary" onClick={() => navigate('/')}>+ Đặt xe mới</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng chuyến', val: MOCK_RENTER_BOOKINGS.length, color: '#374151' },
          { label: 'Đang thuê', val: MOCK_RENTER_BOOKINGS.filter(b => b.status === 'active').length, color: '#2563eb' },
          { label: 'Hoàn thành', val: MOCK_RENTER_BOOKINGS.filter(b => b.status === 'completed').length, color: '#059669' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 18px', border: '1px solid #f0f0f0', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="booking-tabs">
        {TABS.map(t => {
          const count = t.key === 'all' ? MOCK_RENTER_BOOKINGS.length : MOCK_RENTER_BOOKINGS.filter(b => b.status === t.key).length;
          return (
            <button key={t.key} className={`booking-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label} {count > 0 && <span className="booking-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Booking cards */}
      <div className="booking-list">
        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', background: '#fff', borderRadius: 14 }}>
            <MdDirectionsCar style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.3 }} />
            <div>Không có chuyến đi nào</div>
          </div>
        )}
        {displayed.map(b => {
          const action = getStatusAction(b);
          const contractAction = getContractAction(b);
          return (
            <div key={b.id} className="booking-card-item">
              <div className="booking-card-left">
                <div className="booking-card-img">
                  <MdDirectionsCar style={{ fontSize: '2.5rem', color: '#00b14f' }} />
                </div>
                <div className="booking-card-info">
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{b.vehicle}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>{b.showroom}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaCalendarAlt size={11} /> {b.from} → {b.to}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaClock size={11} /> {b.days} ngày
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                      <FaMapMarkerAlt size={11} /> {b.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="booking-card-right">
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={b.status} />
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#00b14f', marginTop: 6 }}>{b.total.toLocaleString()}đ</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Mã: {b.id}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn-icon" onClick={() => setDetailModal(b)} title="Chi tiết"><FaEye /></button>
                  {contractAction && (
                    <button
                      className="btn-icon"
                      onClick={() => navigate(`/contract/sign/${contractAction.contractId}`)}
                      title={contractAction.needsSign ? 'Ký hợp đồng' : 'Xem hợp đồng'}
                      style={contractAction.needsSign ? { borderColor: '#d97706', color: '#d97706' } : {}}
                    >
                      {contractAction.needsSign ? <FaSignature /> : <FaFileContract />}
                    </button>
                  )}
                  <button className="btn-icon" title="Liên hệ showroom"><FaComments /></button>
                  {contractAction?.needsSign && (
                    <button
                      style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => navigate(`/contract/sign/${contractAction.contractId}`)}
                    >
                      <FaSignature size={11} /> Ký hợp đồng
                    </button>
                  )}
                  {action && !contractAction?.needsSign && (
                    <button style={{ background: action.color, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} onClick={action.action}>{action.label}</button>
                  )}
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
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{detailModal.vehicle}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 3 }}>{detailModal.showroom}</div>
            </div>
            {[
              ['Mã đặt xe', detailModal.id],
              ['Ngày nhận xe', detailModal.from],
              ['Ngày trả xe', detailModal.to],
              ['Số ngày thuê', detailModal.days],
              ['Tổng tiền', detailModal.total.toLocaleString() + 'đ'],
              ['Trạng thái', detailModal.status],
              ['Thanh toán', detailModal.payStatus],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
            {detailModal.contractId && (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setDetailModal(null); navigate(`/contract/sign/${detailModal.contractId}`); }}
              >
                <FaFileContract /> Xem / Ký hợp đồng điện tử
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookings;
