import React, { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdDirectionsCar, MdLocalGasStation, MdEventSeat } from 'react-icons/md';
import { MOCK_VEHICLES_ADMIN } from '../../../components/data/mockDashboard';
import '../AdminDashboard/AdminDashboard.css';

const VehicleApproval = () => {
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES_ADMIN);
  const [viewModal, setViewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const approve = (id) => setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v));
  const reject = () => {
    setVehicles(prev => prev.map(v => v.id === rejectModal.id ? { ...v, status: 'rejected' } : v));
    setRejectModal(null); setRejectReason('');
  };

  const columns = [
    { key: 'name', label: 'Tên xe', accessor: 'name', sortable: true, render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
          <MdDirectionsCar size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#111827' }}>{row.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.brand} · {row.category}</div>
        </div>
      </div>
    )},
    { key: 'showroom', label: 'Showroom', accessor: 'showroom' },
    { key: 'source', label: 'Nguồn', render: row => (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 50,
        background: row.source === 'showroom' ? '#dbeafe' : '#e0e7ff',
        color: row.source === 'showroom' ? '#2563eb' : '#4338ca' }}>
        {row.source === 'showroom' ? 'Showroom' : 'Ký gửi'}
      </span>
    )},
    { key: 'price', label: 'Giá/ngày', render: row => <span style={{ fontWeight: 600, color: '#00b14f' }}>{row.price}K</span>, sortable: true, accessor: 'price' },
    { key: 'specs', label: 'Thông số', render: row => (
      <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: 8 }}>
        <span><MdEventSeat /> {row.seats}</span>
        <span><MdLocalGasStation /> {row.fuel}</span>
      </div>
    )},
    { key: 'status', label: 'Trạng thái', render: row => <StatusBadge status={row.status} /> },
    { key: 'submittedAt', label: 'Ngày gửi', accessor: 'submittedAt' },
    { key: 'actions', label: 'Hành động', render: row => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-icon" onClick={() => setViewModal(row)} title="Xem chi tiết"><FaEye /></button>
        {row.status === 'pending' && <>
          <button className="btn-icon" style={{ borderColor: '#059669', color: '#059669' }} onClick={() => approve(row.id)} title="Phê duyệt"><FaCheckCircle /></button>
          <button className="btn-icon danger" onClick={() => setRejectModal(row)} title="Từ chối"><FaTimesCircle /></button>
        </>}
      </div>
    )},
  ];

  const pending = vehicles.filter(v => v.status === 'pending').length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Duyệt xe</h1>
          <p className="page-subtitle">Xét duyệt và quản lý danh sách xe trên nền tảng</p>
        </div>
        {pending > 0 && <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>{pending} xe chờ duyệt</div>}
      </div>
      <DataTable columns={columns} data={vehicles} searchPlaceholder="Tìm theo tên xe, showroom..." />

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Chi tiết xe" width={500}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <MdDirectionsCar size={48} color="#00b14f" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{viewModal.name}</div>
                <StatusBadge status={viewModal.status} />
              </div>
            </div>
            {[
              ['Thương hiệu', viewModal.brand], ['Phân khúc', viewModal.category],
              ['Số chỗ', viewModal.seats + ' chỗ'], ['Nhiên liệu', viewModal.fuel],
              ['Giá thuê', viewModal.price + 'K/ngày'], ['Showroom', viewModal.showroom],
              ['Nguồn xe', viewModal.source === 'showroom' ? 'Xe showroom' : 'Xe ký gửi'],
              ['Ngày gửi duyệt', viewModal.submittedAt],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
            {viewModal.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => { setRejectModal(viewModal); setViewModal(null); }}><FaTimesCircle /> Từ chối</button>
                <button className="btn-success" style={{ flex: 1 }} onClick={() => { approve(viewModal.id); setViewModal(null); }}><FaCheckCircle /> Phê duyệt</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Từ chối xe" width={440}
        footer={<><button className="btn-outline" onClick={() => setRejectModal(null)}>Hủy</button><button className="btn-danger" onClick={reject}>Xác nhận từ chối</button></>}
      >
        {rejectModal && (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 12 }}>Từ chối xe <b>{rejectModal.name}</b>. Lý do:</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." style={{ width: '100%', minHeight: 100, border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VehicleApproval;
