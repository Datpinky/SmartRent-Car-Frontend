import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FaSave, FaUser, FaShieldAlt, FaKey, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { MdVerifiedUser, MdAdminPanelSettings } from 'react-icons/md';

const ACTIVITY_LOG = [
  { id: 1, action: 'Phê duyệt Showroom "Xe Tốt Thủ Đức"',      time: '11/03/2026 09:42', dateTime: '2026-03-11T09:42' },
  { id: 2, action: 'Khóa tài khoản user ID #5 (Hoàng Văn Em)', time: '10/03/2026 15:20', dateTime: '2026-03-10T15:20' },
  { id: 3, action: 'Từ chối xe Ford Ranger BKS 51Q-89012',      time: '09/03/2026 11:05', dateTime: '2026-03-09T11:05' },
  { id: 4, action: 'Duyệt hồ sơ showroom "Auto Center Q1"',    time: '08/03/2026 14:33', dateTime: '2026-03-08T14:33' },
  { id: 5, action: 'Cập nhật cài đặt hệ thống – Phí DV: 5%',   time: '07/03/2026 10:00', dateTime: '2026-03-07T10:00' },
];

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    name:    user?.name  || 'Admin SmartRent',
    email:   user?.email || 'admin@smartrent.com',
    phone:   user?.phone || '0900000001',
    address: '100 Lê Lợi, Q.1, TP.HCM',
    dept:    'Ban Quản trị Hệ thống',
  });
  const [saved, setSaved] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'AD';

  const handleFieldChange = (key, value) => {
    if (key === 'phone') {
      const digits = String(value).replace(/\D/g, '').slice(0, 10);
      setForm(f => ({ ...f, phone: digits }));
      setPhoneError('');
      return;
    }
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    const phoneDigits = (form.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setPhoneError('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }
    setPhoneError('');
    updateUser({ name: form.name, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePwSave = () => {
    if (!pwForm.current) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (pwForm.next.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    setPwError('');
    setPwSaved(true);
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwSaved(false), 2500);
  };

  const TABS = [
    ['info',     <FaUser aria-hidden="true" />,             'Thông tin'],
    ['security', <FaShieldAlt aria-hidden="true" />,        'Bảo mật'],
    ['activity', <FaHistory aria-hidden="true" />,          'Lịch sử hoạt động'],
  ];

  return (
    <div className="ap-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Hồ sơ Quản trị viên</h1>
          <p className="page-subtitle">Quản lý thông tin tài khoản và cài đặt bảo mật</p>
        </div>
      </div>

      {/* Hero */}
      <div className="ap-hero">
        <div className="ap-avatar-wrap">
          <div className="ap-avatar">{initials}</div>
          <div className="ap-avatar-badge"><MdAdminPanelSettings aria-hidden="true" /></div>
        </div>
        <div className="ap-hero-info">
          <div className="ap-hero-name">{user?.name}</div>
          <div className="ap-hero-email">{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="ap-role-badge"><MdVerifiedUser aria-hidden="true" style={{ fontSize: '0.8rem' }} /> Quản trị viên</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', alignSelf: 'center' }}>Truy cập toàn quyền hệ thống</span>
          </div>
        </div>
        <div className="ap-hero-stats">
          <div className="ap-stat">
            <div className="ap-stat-val tabular-nums">1,247</div>
            <div className="ap-stat-label">Người dùng</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-val tabular-nums">23</div>
            <div className="ap-stat-label">Showroom</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-val tabular-nums">3,891</div>
            <div className="ap-stat-label">Tổng booking</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ap-tabs">
        {TABS.map(([key, icon, label]) => (
          <button
            type="button"
            key={key}
            className={`ap-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="ap-card">
          <h3 className="ap-section-title">Thông tin cá nhân</h3>
          <div className="ap-form-grid">
            {[
              ['Họ và tên',              'name',  'text',  'name'],
              ['Email',                  'email', 'email', 'email'],
              ['Số điện thoại (10 số)',  'phone', 'tel',   'tel'],
              ['Phòng ban',              'dept',  'text',  'organization-title'],
            ].map(([label, key, type, autoComplete]) => (
              <div key={key}>
                <label htmlFor={`ap-${key}`} className="ap-label">{label}</label>
                <input
                  id={`ap-${key}`}
                  type={type}
                  autoComplete={autoComplete}
                  value={form[key]}
                  onChange={e => handleFieldChange(key, e.target.value)}
                  className="ap-input"
                  {...(key === 'phone' ? { maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' } : {})}
                />
              </div>
            ))}
            {phoneError && <div style={{ gridColumn: 'span 2', color: '#dc2626', fontSize: '0.82rem', marginTop: 6 }}>{phoneError}</div>}
            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="ap-address" className="ap-label">Địa chỉ</label>
              <input
                id="ap-address"
                autoComplete="street-address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="ap-input"
              />
            </div>
          </div>
          
          <button type="button" className="ap-btn-primary" onClick={handleSave} style={{ marginTop: 16 }}>
            <FaSave aria-hidden="true" /> {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="ap-card">
          <h3 className="ap-section-title">Đổi mật khẩu</h3>
          <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Mật khẩu hiện tại',     'current', 'current-password'],
              ['Mật khẩu mới',          'next',    'new-password'],
              ['Xác nhận mật khẩu mới', 'confirm', 'new-password'],
            ].map(([label, key, autoComplete]) => (
              <div key={key}>
                <label htmlFor={`ap-pw-${key}`} className="ap-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <FaKey aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }} />
                  <input
                    id={`ap-pw-${key}`}
                    type="password"
                    autoComplete={autoComplete}
                    value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="ap-input"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>
            ))}
            {pwError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.82rem' }}>
                {pwError}
              </div>
            )}
            {pwSaved && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', color: '#166534', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaCheckCircle aria-hidden="true" /> Mật khẩu đã được cập nhật thành công!
              </div>
            )}
            <button type="button" className="ap-btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handlePwSave}>
              <FaShieldAlt aria-hidden="true" /> Cập nhật mật khẩu
            </button>
          </div>

          <div style={{ marginTop: 32 }}>
            <h3 className="ap-section-title">Phiên đăng nhập</h3>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>Thiết bị hiện tại</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Windows 10 – Chrome – TP.HCM · 14/03/2026</div>
                </div>
                <span style={{ background: '#d1fae5', color: '#059669', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50 }}>Hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div className="ap-card">
          <h3 className="ap-section-title">Lịch sử thao tác gần đây</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ACTIVITY_LOG.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: i < ACTIVITY_LOG.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9', flexShrink: 0, fontSize: '0.85rem' }}>
                  <MdAdminPanelSettings aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{item.action}</div>
                  <time dateTime={item.dateTime} style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3, display: 'block' }}>{item.time}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
