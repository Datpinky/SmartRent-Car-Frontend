import React, { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaEye, FaDownload, FaFileContract, FaFileSignature, FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getContracts } from '../../../components/data/contractHelpers';
import { MOCK_BOOKINGS } from '../../../components/data/mockDashboard';

const PENDING_BOOKING_IDS = ['BK0002', 'BK0005', 'BK0006'];

const ContractManagement = () => {
  const navigate = useNavigate();
  const [contracts] = useState(() => getContracts());
  const [viewModal, setViewModal] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? contracts
    : contracts.filter(c => c.type === filter || c.status === filter);

  const pendingBookings = MOCK_BOOKINGS.filter(b =>
    PENDING_BOOKING_IDS.includes(b.id) &&
    !contracts.find(c => c.bookingId === b.id)
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Quản lý Hợp đồng</h1>
          <p className="page-subtitle">Theo dõi hợp đồng thuê xe và hợp đồng dịch vụ</p>
        </div>
        {pendingBookings.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {pendingBookings.slice(0, 2).map(b => (
              <button
                key={b.id}
                className="btn-primary"
                onClick={() => navigate(`/showroom/contracts/create/${b.id}`)}
              >
                <FaPlus /> Tạo HĐ – {b.id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['all', 'Tất cả'],
          ['rental', 'HĐ thuê xe'],
          ['service', 'HĐ dịch vụ'],
          ['active', 'Đã ký'],
          ['pending_renter_sign', 'Chờ ký'],
          ['draft', 'Nháp'],
          ['expired', 'Hết hạn'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: '5px 12px', borderRadius: 50, border: '1.5px solid',
              borderColor: filter === k ? '#00b14f' : '#e5e7eb',
              background: filter === k ? '#00b14f' : '#fff',
              color: filter === k ? '#fff' : '#374151',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Mã HĐ</th><th>Loại</th><th>Bên thuê / Xe</th>
              <th>Thời hạn</th><th>Tổng tiền</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>Không có hợp đồng nào</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id}>
                <td><span className="code-badge">{c.id}</span></td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: c.type === 'rental' ? '#2563eb' : '#7c3aed' }}>
                    {c.type === 'rental' ? <FaFileContract /> : <FaFileSignature />}
                    {c.type === 'rental' ? 'Thuê xe' : 'Dịch vụ'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#111827' }}>{c.renter}</div>
                  {c.vehicle !== '-' && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{c.vehicle}</div>}
                </td>
                <td style={{ fontSize: '0.8rem', color: '#374151' }}>{c.from} → {c.to}</td>
                <td style={{ fontWeight: 700, color: c.total > 0 ? '#00b14f' : '#9ca3af' }}>
                  {c.total > 0 ? c.total.toLocaleString() + 'đ' : '—'}
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn-icon" onClick={() => { setViewModal(c); }} title="Xem chi tiết"><FaEye /></button>
                    <button
                      className="btn-icon"
                      onClick={() => navigate(`/contract/sign/${c.id}`)}
                      title="Mở hợp đồng"
                    >
                      <FaExternalLinkAlt />
                    </button>
                    <button className="btn-icon" title="Tải PDF"><FaDownload /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Chi tiết hợp đồng" width={540}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="code-badge" style={{ marginBottom: 6, display: 'inline-block' }}>{viewModal.id}</span>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
                  {viewModal.type === 'rental' ? 'Hợp đồng thuê xe' : 'Hợp đồng dịch vụ'}
                </div>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            {[
              ['Bên thuê/Khách hàng', viewModal.renter],
              ['Xe', viewModal.vehicle !== '-' ? viewModal.vehicle : '—'],
              ['Biển số', viewModal.plate || '—'],
              ['Ngày bắt đầu', viewModal.from],
              ['Ngày kết thúc', viewModal.to],
              ['Tiền cọc', viewModal.deposit > 0 ? viewModal.deposit.toLocaleString() + 'đ' : '—'],
              ['Tổng giá trị', viewModal.total > 0 ? viewModal.total.toLocaleString() + 'đ' : '—'],
              ['Mã booking liên kết', viewModal.bookingId !== '-' ? viewModal.bookingId : '—'],
              ['Ngày tạo', viewModal.createdAt],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-outline"
                style={{ flex: 1 }}
                onClick={() => { setViewModal(null); navigate(`/contract/sign/${viewModal.id}`); }}
              >
                <FaExternalLinkAlt /> Mở hợp đồng
              </button>
              <button className="btn-primary" style={{ flex: 1 }}>
                <FaDownload /> Tải PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContractManagement;
