import React, { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { FaPlus, FaEye, FaLock, FaUnlock, FaUserEdit, FaCheckCircle, FaTimesCircle, FaIdCard } from 'react-icons/fa';
import { MOCK_USERS } from '../../../components/data/mockDashboard';
import '../AdminDashboard/AdminDashboard.css';

const ROLE_LABELS = { admin: 'Quản trị viên', showroom: 'Showroom', owner: 'Chủ xe', renter: 'Khách thuê' };
const ROLE_COLORS = { admin: '#6d28d9', showroom: '#00b14f', owner: '#0891b2', renter: '#d97706' };

const UserManagement = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [kycUser, setKycUser] = useState(null);

  const openModal = (user, type) => { setSelectedUser(user); setModalType(type); };
  const closeModal = () => { setSelectedUser(null); setModalType(null); };

  const toggleLock = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'locked' ? 'verified' : 'locked' } : u));
  const approveKyc = (id) => { setUsers(prev => prev.map(u => u.id === id ? { ...u, kyc: 'verified', status: 'verified' } : u)); setKycUser(null); };
  const rejectKyc = (id) => { setUsers(prev => prev.map(u => u.id === id ? { ...u, kyc: 'rejected' } : u)); setKycUser(null); };

  const columns = [
    { key: 'name', label: 'Người dùng', accessor: 'name', sortable: true, render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: ROLE_COLORS[row.role] + '25', color: ROLE_COLORS[row.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
          {row.name.split(' ').map(w => w[0]).slice(-2).join('')}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.83rem' }}>{row.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.email}</div>
        </div>
      </div>
    )},
    { key: 'role', label: 'Vai trò', render: row => (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ROLE_COLORS[row.role], background: ROLE_COLORS[row.role] + '15', padding: '3px 9px', borderRadius: 50 }}>
        {ROLE_LABELS[row.role]}
      </span>
    )},
    { key: 'phone', label: 'Điện thoại', accessor: 'phone' },
    { key: 'bookings', label: 'Chuyến', accessor: 'bookings', sortable: true, align: 'center' },
    { key: 'kyc', label: 'eKYC', render: row => <StatusBadge status={row.kyc} /> },
    { key: 'status', label: 'Tài khoản', render: row => <StatusBadge status={row.status} /> },
    { key: 'createdAt', label: 'Ngày tạo', accessor: 'createdAt' },
    { key: 'actions', label: 'Hành động', render: row => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-icon" title="Xem chi tiết" onClick={() => openModal(row, 'view')}><FaEye /></button>
        {row.kyc === 'pending' && <button className="btn-icon" title="Duyệt eKYC" onClick={() => setKycUser(row)} style={{ borderColor: '#d97706', color: '#d97706' }}><FaIdCard /></button>}
        <button className="btn-icon" title={row.status === 'locked' ? 'Mở khóa' : 'Khóa'} onClick={() => toggleLock(row.id)} style={row.status === 'locked' ? { borderColor: '#059669', color: '#059669' } : {}}>
          {row.status === 'locked' ? <FaUnlock /> : <FaLock />}
        </button>
      </div>
    )},
  ];

  const pendingKyc = users.filter(u => u.kyc === 'pending').length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">Quản lý tất cả tài khoản trên nền tảng SmartRent Car</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {pendingKyc > 0 && (
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}>
              {pendingKyc} eKYC chờ duyệt
            </div>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} style={{ background: '#fff', borderRadius: 10, padding: '10px 16px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROLE_COLORS[role], display: 'inline-block' }} />
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}:</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{count}</span>
            </div>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Tìm theo tên, email..."
      />

      {/* View User Modal */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Chi tiết người dùng" width={480}>
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: ROLE_COLORS[selectedUser.role] + '25', color: ROLE_COLORS[selectedUser.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                {selectedUser.name.split(' ').map(w => w[0]).slice(-2).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{selectedUser.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{selectedUser.email}</div>
              </div>
            </div>
            {[
              ['Vai trò', ROLE_LABELS[selectedUser.role]],
              ['Điện thoại', selectedUser.phone],
              ['Ngày tham gia', selectedUser.createdAt],
              ['Số chuyến', selectedUser.bookings],
              ['Trạng thái eKYC', selectedUser.kyc],
              ['Trạng thái tài khoản', selectedUser.status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{k}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* KYC Review Modal */}
      <Modal isOpen={!!kycUser} onClose={() => setKycUser(null)} title="Xét duyệt eKYC" width={500}
        footer={
          <>
            <button className="btn-danger" onClick={() => rejectKyc(kycUser?.id)}><FaTimesCircle /> Từ chối</button>
            <button className="btn-success" onClick={() => approveKyc(kycUser?.id)}><FaCheckCircle /> Phê duyệt</button>
          </>
        }
      >
        {kycUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{kycUser.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{kycUser.email} · {kycUser.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Căn cước công dân (CCCD)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['Mặt trước', 'Mặt sau'].map(side => (
                  <div key={side} style={{ background: '#e5e7eb', borderRadius: 10, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                    <FaIdCard style={{ fontSize: '1.5rem', marginRight: 6 }} /> {side}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Giấy phép lái xe (GPLX)</div>
              <div style={{ background: '#e5e7eb', borderRadius: 10, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                <FaIdCard style={{ fontSize: '1.5rem', marginRight: 6 }} /> Mặt trước GPLX
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
