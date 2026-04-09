import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FaSave, FaUser, FaShieldAlt, FaKey, FaCheckCircle } from 'react-icons/fa';
import { MdVerifiedUser, MdAdminPanelSettings } from 'react-icons/md';
import adminService from '../../../services/adminService';
import { PasswordStrengthInput, passwordMeetsPolicy } from '../../../components/common/PasswordInput';

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
  const [stats, setStats] = useState({ totalUsers: 0, totalShowrooms: 0, totalBookings: 0 });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'AD';
  const formattedStats = useMemo(
    () => ({
      totalUsers: Number(stats.totalUsers || 0).toLocaleString('vi-VN'),
      totalShowrooms: Number(stats.totalShowrooms || 0).toLocaleString('vi-VN'),
      totalBookings: Number(stats.totalBookings || 0).toLocaleString('vi-VN'),
    }),
    [stats]
  );

  useEffect(() => {
    let mounted = true;
    const loadProfileData = async () => {
      setLoading(true);
      setPageError('');
      try {
        const [overview, currentSessions] = await Promise.all([
          adminService.getProfileOverview(),
          adminService.getProfileSessions(),
        ]);
        if (!mounted) return;

        setForm({
          name: overview?.profile?.name || user?.name || '',
          email: overview?.profile?.email || user?.email || '',
          phone: overview?.profile?.phone || user?.phone || '',
          address: overview?.profile?.address || '100 Lê Lợi, Q.1, TP.HCM',
          dept: overview?.profile?.dept || 'Ban Quản trị Hệ thống',
        });
        setStats(overview?.stats || { totalUsers: 0, totalShowrooms: 0, totalBookings: 0 });
        setSessions(Array.isArray(currentSessions) ? currentSessions : []);
      } catch (err) {
        if (!mounted) return;
        setPageError(err.message || 'Không thể tải dữ liệu hồ sơ admin.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfileData();
    return () => { mounted = false; };
  }, [user?.email, user?.name, user?.phone]);

  const handleFieldChange = (key, value) => {
    if (key === 'phone') {
      const digits = String(value).replace(/\D/g, '').slice(0, 10);
      setForm(f => ({ ...f, phone: digits }));
      setPhoneError('');
      return;
    }
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    const phoneDigits = (form.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setPhoneError('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }
    setPhoneError('');
    try {
      const updated = await adminService.updateProfile({
        name: form.name,
        phone: form.phone,
      });
      updateUser({ name: updated.name, phone: updated.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setPhoneError(err.message || 'Không thể cập nhật thông tin.');
    }
  };

  const handlePwSave = async () => {
    if (!pwForm.current) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (!passwordMeetsPolicy(pwForm.next)) { setPwError('Mật khẩu chưa đủ độ mạnh. Vui lòng đáp ứng đủ các yêu cầu bên dưới ô mật khẩu.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    try {
      await adminService.changePassword({
        current_password: pwForm.current,
        new_password: pwForm.next,
        confirm_password: pwForm.confirm,
      });
      setPwError('');
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwSaved(false);
      setPwError(err.message || 'Không thể đổi mật khẩu.');
    }
  };

  const TABS = [
    ['info',     <FaUser aria-hidden="true" />,             'Thông tin'],
    ['security', <FaShieldAlt aria-hidden="true" />,        'Bảo mật'],
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
            <div className="ap-stat-val tabular-nums">{formattedStats.totalUsers}</div>
            <div className="ap-stat-label">Người dùng</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-val tabular-nums">{formattedStats.totalShowrooms}</div>
            <div className="ap-stat-label">Showroom</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-val tabular-nums">{formattedStats.totalBookings}</div>
            <div className="ap-stat-label">Tổng booking</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="ap-card" style={{ marginTop: 14, fontSize: '0.88rem', color: '#6b7280' }}>
          Đang tải dữ liệu hồ sơ...
        </div>
      )}
      {pageError && (
        <div className="ap-card" style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.84rem' }}>
          {pageError}
        </div>
      )}

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
            <div>
              <label htmlFor="ap-pw-current" className="ap-label">Mật khẩu hiện tại</label>
              <div style={{ position: 'relative' }}>
                <FaKey aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }} />
                <input
                  id="ap-pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  placeholder="••••••••"
                  className="ap-input"
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ap-pw-next" className="ap-label">Mật khẩu mới</label>
              <PasswordStrengthInput
                id="ap-pw-next"
                name="next"
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                error={!!pwError && (pwError.includes('độ mạnh') || pwError.includes('ít nhất'))}
                placeholder="Nhập mật khẩu mới"
              />
            </div>

            <div>
              <label htmlFor="ap-pw-confirm" className="ap-label">Xác nhận mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <FaKey aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }} />
                <input
                  id="ap-pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="••••••••"
                  className="ap-input"
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>
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
              {sessions.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Chưa có dữ liệu phiên đăng nhập.</div>
              ) : sessions.map((session) => (
                <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>Thiết bị hiện tại</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                      {session.device} · {session.location} · {session.lastSeen} · IP: {session.ipAddress}
                    </div>
                  </div>
                  <span style={{ background: '#d1fae5', color: '#059669', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50 }}>
                    {session.isActive ? 'Hoạt động' : 'Đã ngắt'}
                  </span>
                </div>
              ))
              }
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProfile;
