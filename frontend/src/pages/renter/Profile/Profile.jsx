import React, { useState } from 'react';
import FileUpload from '../../../components/common/FileUpload';
import StatusBadge from '../../../components/common/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { FaSave, FaIdCard, FaCheckCircle, FaUser, FaShieldAlt } from 'react-icons/fa';
import { MdVerifiedUser } from 'react-icons/md';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', dob: '01/01/1995', address: '123 Nguyễn Trãi, Q.1, TP.HCM' });
  const [kycStatus, setKycStatus] = useState('unverified');
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFieldChange = (key, value) => {
    if (key === 'phone') {
      const digits = String(value).replace(/\D/g, '').slice(0, 10);
      setForm(f => ({ ...f, phone: digits }));
      return;
    }
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    const phoneDigits = (form.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setFormError('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }
    setFormError('');
    updateUser({ name: form.name, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const handleKycSubmit = () => setKycStatus('pending');

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  return (
    <div className="profile-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div><h1 className="page-title">Hồ sơ cá nhân</h1><p className="page-subtitle">Quản lý thông tin và xác minh danh tính</p></div>
      </div>

      {/* Profile card */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-big">{initials}</div>
          <button className="profile-avatar-edit">✎</button>
        </div>
        <div className="profile-hero-info">
          <div className="profile-hero-name">{user?.name}</div>
          <div className="profile-hero-email">{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={kycStatus} />
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Thành viên từ tháng 1, 2026</span>
          </div>
        </div>
        <div className="profile-hero-stats">
          <div className="profile-stat"><div className="profile-stat-val">8</div><div className="profile-stat-label">Chuyến đã thuê</div></div>
          <div className="profile-stat"><div className="profile-stat-val">4.9</div><div className="profile-stat-label">Đánh giá TB</div></div>
          <div className="profile-stat"><div className="profile-stat-val">0</div><div className="profile-stat-label">Báo cáo vi phạm</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {[['info', <FaUser />, 'Thông tin'], ['kyc', <FaIdCard />, 'Xác minh danh tính'], ['security', <FaShieldAlt />, 'Bảo mật']].map(([key, icon, label]) => (
          <button key={key} className={`profile-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="profile-card">
          <h3 className="profile-section-title">Thông tin cá nhân</h3>
          <div className="profile-form-grid">
            {[
              ['Họ và tên', 'name', 'text'], ['Email', 'email', 'email'],
              ['Số điện thoại (10 số)', 'phone', 'tel'], ['Ngày sinh', 'dob', 'text'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => handleFieldChange(key, e.target.value)}
                  className="form-input"
                  {...(key === 'phone' ? { maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' } : {})}
                />
              </div>
            ))}
            {formError && <div style={{ gridColumn: 'span 2', color: '#dc2626', fontSize: '0.82rem', marginTop: 6 }}>{formError}</div>}
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Địa chỉ</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="form-input" />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSave} style={{ marginTop: 16 }}>
            <FaSave /> {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        </div>
      )}

      {/* KYC Tab */}
      {tab === 'kyc' && (
        <div className="profile-card">
          {kycStatus === 'verified' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <MdVerifiedUser style={{ fontSize: '4rem', color: '#059669', marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: 4 }}>Danh tính đã được xác minh</div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Bạn có thể thuê xe trên SmartRent Car.</p>
            </div>
          ) : kycStatus === 'pending' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.8rem' }}>⏳</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>Đang chờ xét duyệt</div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Hồ sơ của bạn đang được xem xét. Thường trong 24 giờ làm việc.</p>
            </div>
          ) : (
            <div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⚠ Chưa xác minh danh tính</div>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>Bạn cần xác minh CCCD và GPLX để thuê xe trên SmartRent Car.</p>
              </div>

              <h3 className="profile-section-title">Căn cước công dân (CCCD)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <FileUpload label="Mặt trước" hint="JPG, PNG, dưới 5MB" />
                <FileUpload label="Mặt sau" hint="JPG, PNG, dưới 5MB" />
              </div>

              <h3 className="profile-section-title">Giấy phép lái xe (GPLX)</h3>
              <FileUpload label="Ảnh GPLX" hint="Ảnh rõ nét, đúng thông tin, còn hạn" />

              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, margin: '20px 0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <FaCheckCircle color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: '0.8rem', color: '#374151', margin: 0 }}>Thông tin của bạn được bảo mật và chỉ dùng cho mục đích xác minh danh tính theo quy định.</p>
              </div>

              <button className="btn-primary" onClick={handleKycSubmit}>Gửi hồ sơ xác minh</button>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="profile-card">
          <h3 className="profile-section-title">Đổi mật khẩu</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 440 }}>
            {['Mật khẩu hiện tại', 'Mật khẩu mới', 'Xác nhận mật khẩu mới'].map(label => (
              <div key={label}>
                <label className="form-label">{label}</label>
                <input type="password" className="form-input" placeholder="••••••••" />
              </div>
            ))}
            <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Cập nhật mật khẩu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
