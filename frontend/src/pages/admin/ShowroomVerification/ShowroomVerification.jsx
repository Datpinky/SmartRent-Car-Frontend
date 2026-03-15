import React, { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaEye, FaCheckCircle, FaTimesCircle, FaStar, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { MOCK_SHOWROOMS } from '../../../components/data/mockDashboard';
import '../AdminDashboard/AdminDashboard.css';

const ShowroomVerification = () => {
  const [showrooms, setShowrooms] = useState(MOCK_SHOWROOMS);
  const [viewModal, setViewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const approve = (id) => setShowrooms(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  const reject = () => {
    setShowrooms(prev => prev.map(s => s.id === rejectModal.id ? { ...s, status: 'rejected' } : s));
    setRejectModal(null); setRejectReason('');
  };

  const columns = [
    { key: 'name', label: 'Tên Showroom', accessor: 'name', sortable: true, render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', flexShrink: 0 }}>
          <FaBuilding />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#111827' }}>{row.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.email}</div>
        </div>
      </div>
    )},
    { key: 'owner',   label: 'Chủ sở hữu', accessor: 'owner' },
    { key: 'address', label: 'Địa chỉ',     accessor: 'address', render: row => <span style={{ fontSize: '0.8rem', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.address}</span> },
    { key: 'vehicles', label: 'Số xe',       accessor: 'vehicles', sortable: true, align: 'center' },
    { key: 'rating',  label: 'Đánh giá', render: row => row.rating > 0 ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: '#d97706' }}>
        <FaStar size={12} /> {row.rating}
      </span>
    ) : <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Chưa có</span> },
    { key: 'status',  label: 'Trạng thái', render: row => <StatusBadge status={row.status} /> },
    { key: 'createdAt', label: 'Ngày đăng ký', accessor: 'createdAt' },
    { key: 'actions', label: 'Hành động', render: row => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-icon" onClick={() => setViewModal(row)} title="Xem hồ sơ"><FaEye /></button>
        {row.status === 'pending' && <>
          <button className="btn-icon" style={{ borderColor: '#059669', color: '#059669' }} onClick={() => approve(row.id)} title="Phê duyệt"><FaCheckCircle /></button>
          <button className="btn-icon danger" onClick={() => setRejectModal(row)} title="Từ chối"><FaTimesCircle /></button>
        </>}
      </div>
    )},
  ];

  const pending = showrooms.filter(s => s.status === 'pending').length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Xác minh Showroom</h1>
          <p className="page-subtitle">Xét duyệt và quản lý các showroom trên nền tảng</p>
        </div>
        {pending > 0 && <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>{pending} Showroom chờ duyệt</div>}
      </div>

      <DataTable columns={columns} data={showrooms} searchPlaceholder="Tìm theo tên showroom..." />

      {/* Detail Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Hồ sơ Showroom" width={540}>
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>{viewModal.name}</div>
              <StatusBadge status={viewModal.status} />
            </div>
            {[
              [<FaBuilding />, 'Chủ sở hữu', viewModal.owner],
              [<FaPhone />, 'Điện thoại', viewModal.phone],
              [<FaEnvelope />, 'Email', viewModal.email],
              [<FaMapMarkerAlt />, 'Địa chỉ', viewModal.address],
            ].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#00b14f', marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#111827' }}>{val}</div>
                </div>
              </div>
            ))}
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>Giấy phép kinh doanh</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>{viewModal.license || 'Chưa cung cấp'}</div>
            </div>
            {viewModal.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => { setRejectModal(viewModal); setViewModal(null); }}><FaTimesCircle /> Từ chối</button>
                <button className="btn-success" style={{ flex: 1 }} onClick={() => { approve(viewModal.id); setViewModal(null); }}><FaCheckCircle /> Phê duyệt</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Từ chối Showroom" width={440}
        footer={<><button className="btn-outline" onClick={() => setRejectModal(null)}>Hủy</button><button className="btn-danger" onClick={reject}>Xác nhận từ chối</button></>}
      >
        {rejectModal && (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 12 }}>Bạn đang từ chối showroom <b>{rejectModal.name}</b>. Vui lòng nhập lý do:</p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              style={{ width: '100%', minHeight: 100, border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShowroomVerification;
