import React, { useState } from 'react';
import './OwnerProfile.css';
import FileUpload from '../../../components/common/FileUpload';
import StatusBadge from '../../../components/common/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaSave, FaIdCard, FaCheckCircle, FaUser, FaShieldAlt, FaCar,
  FaKey, FaMoneyBillWave, FaExclamationCircle,
} from 'react-icons/fa';
import { MdVerifiedUser, MdDirectionsCar } from 'react-icons/md';

const OWNER_STATS = [
  { label: 'Xe đang ký gửi',  value: '3',          icon: <MdDirectionsCar />, color: '#6d28d9' },
  { label: 'Tổng doanh thu',   value: '52,400,000₫', icon: <FaMoneyBillWave />, color: '#059669' },
  { label: 'Chờ rút tiền',     value: '8,200,000₫',  icon: <FaExclamationCircle />, color: '#d97706' },
];

const KYC_DOCS = [
  { key: 'cccd',  label: 'CCCD / Căn cước công dân',  hint: 'Chụp 2 mặt CCCD rõ nét (PNG/JPG, ≤ 5MB)' },
  { key: 'gplx',  label: 'Giấy phép lái xe',           hint: 'Chụp 2 mặt GPLX còn hiệu lực (PNG/JPG, ≤ 5MB)' },
  { key: 'sohong', label: 'Sổ hồng / Đăng ký xe',     hint: 'Giấy tờ chứng minh quyền sở hữu xe (PNG/JPG, ≤ 5MB)' },
];

const OwnerProfile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab]         = useState('info');
  const [form, setForm]       = useState({
    name:    user?.name  || 'Nguyễn Văn Khoa',
    email:   user?.email || 'owner@smartrent.com',
    phone:   user?.phone || '0900000003',
    dob:     '15/07/1985',
    address: '56 Trần Hưng Đạo, Q.1, TP.HCM',
    bank:    'Vietcombank – 0012345678910',
  });
  const [saved, setSaved]     = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError]   = useState('');
  const [dobError, setDobError]     = useState('');
  const [emailError, setEmailError] = useState('');
  const [kycStatus, setKycStatus] = useState('pending');
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'OW';

  const toTitleCase = (str) =>
    str.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').replace(/\b(\S)/g, (c) => c.toUpperCase());

  const handleFieldChange = (key, value) => {
    if (key === 'name') {
      // Only allow letters and spaces (including Vietnamese), auto capitalize
      if (/[^a-zA-ZÀ-ỹ\s]/.test(value)) {
        setNameError('Họ và tên chỉ được chứa chữ cái.');
      } else {
        setNameError('');
      }
      setForm(f => ({ ...f, name: toTitleCase(value) }));
      return;
    }
    if (key === 'phone') {
      // Only allow digits, max 10
      const digits = String(value).replace(/\D/g, '').slice(0, 10);
      setForm(f => ({ ...f, phone: digits }));
      setPhoneError('');
      return;
    }
    if (key === 'email') {
      setEmailError('');
    }
    if (key === 'dob') {
      setDobError('');
    }
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    let hasError = false;

    // Name validation
    const trimmedName = (form.name || '').trim();
    if (!trimmedName) {
      setNameError('Họ và tên không được để trống.');
      hasError = true;
    } else if (/[^a-zA-ZÀ-ỹ\s]/.test(trimmedName)) {
      setNameError('Họ và tên chỉ được chứa chữ cái.');
      hasError = true;
    } else {
      setNameError('');
    }

    // DOB validation
    const dobParts = (form.dob || '').split('/');
    let dobValid = false;
    if (dobParts.length === 3) {
      const [day, month, year] = dobParts.map(Number);
      const dob = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const age = today.getFullYear() - dob.getFullYear() -
        (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      if (isNaN(dob.getTime())) {
        setDobError('Ngày sinh không hợp lệ (định dạng DD/MM/YYYY).');
        hasError = true;
      } else if (dob >= today) {
        setDobError('Ngày sinh không được là ngày trong tương lai.');
        hasError = true;
      } else if (age < 18) {
        setDobError('Bạn phải đủ 18 tuổi để đăng ký.');
        hasError = true;
      } else {
        setDobError('');
        dobValid = true;
      }
    } else {
      setDobError('Ngày sinh không hợp lệ (định dạng DD/MM/YYYY).');
      hasError = true;
    }

    // Phone validation
    const phoneDigits = (form.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setPhoneError('Số điện thoại phải có đúng 10 chữ số.');
      hasError = true;
    } else if (!phoneDigits.startsWith('0')) {
      setPhoneError('Số điện thoại phải bắt đầu bằng số 0.');
      hasError = true;
    } else {
      setPhoneError('');
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email || '')) {
      setEmailError('Email không hợp lệ (ví dụ: name@domain.com).');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (hasError) return;

    updateUser({ name: form.name, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleKycSubmit = () => setKycStatus('pending');

  const handlePwSave = () => {
    if (!pwForm.current)            { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (pwForm.next.length < 6)     { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    setPwError('');
    setPwSaved(true);
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwSaved(false), 2500);
  };

  const TABS = [
    ['info',     <FaUser />,         'Thông tin'],
    ['kyc',      <FaIdCard />,       'Xác minh danh tính'],
    ['security', <FaShieldAlt />,    'Bảo mật'],
  ];

  return (
    <div className="op-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Hồ sơ Chủ xe</h1>
          <p className="page-subtitle">Quản lý thông tin, xác minh danh tính và bảo mật tài khoản</p>
        </div>
      </div>

      {/* Hero */}
      <div className="op-hero">
        <div className="op-avatar-wrap">
          <div className="op-avatar">{initials}</div>
          <div className="op-avatar-badge"><FaCar /></div>
        </div>
        <div className="op-hero-info">
          <div className="op-hero-name">{user?.name}</div>
          <div className="op-hero-email">{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="op-role-badge"><MdVerifiedUser style={{ fontSize: '0.8rem' }} /> Chủ xe ký gửi</span>
            <StatusBadge status={kycStatus} />
          </div>
        </div>
        <div className="op-hero-stats">
          {OWNER_STATS.map(s => (
            <div key={s.label} className="op-stat">
              <div className="op-stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="op-stat-val">{s.value}</div>
              <div className="op-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="op-tabs">
        {TABS.map(([key, icon, label]) => (
          <button
            key={key}
            className={`op-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="op-card">
          <h3 className="op-section-title">Thông tin cá nhân</h3>
          <div className="op-form-grid">
            {/* Name */}
            <div>
              <label className="op-label">Họ và tên</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className="op-input"
                placeholder="Nguyễn Văn A"
              />
              {nameError && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4 }}>{nameError}</div>}
            </div>

            {/* Email */}
            <div>
              <label className="op-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                className="op-input"
                placeholder="name@domain.com"
              />
              {emailError && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4 }}>{emailError}</div>}
            </div>

            {/* Phone */}
            <div>
              <label className="op-label">Số điện thoại (10 số)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleFieldChange('phone', e.target.value)}
                className="op-input"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0xxxxxxxxx"
              />
              {phoneError && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4 }}>{phoneError}</div>}
            </div>

            {/* DOB */}
            <div>
              <label className="op-label">Ngày sinh (DD/MM/YYYY)</label>
              <input
                type="text"
                value={form.dob}
                onChange={e => handleFieldChange('dob', e.target.value)}
                className="op-input"
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
              {dobError && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4 }}>{dobError}</div>}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="op-label">Địa chỉ</label>
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="op-input"
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="op-label">Tài khoản ngân hàng nhận tiền</label>
              <input
                value={form.bank}
                onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
                className="op-input"
                placeholder="Tên ngân hàng – Số tài khoản"
              />
            </div>
          </div>
          <button className="op-btn-primary" onClick={handleSave} style={{ marginTop: 18 }}>
            <FaSave /> {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        </div>
      )}

      {/* KYC Tab */}
      {tab === 'kyc' && (
        <div className="op-card">
          <h3 className="op-section-title">Xác minh danh tính (eKYC)</h3>
          <div style={{ marginBottom: 18, padding: '12px 16px', background: kycStatus === 'pending' ? '#fffbeb' : kycStatus === 'verified' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${kycStatus === 'pending' ? '#fde68a' : kycStatus === 'verified' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            {kycStatus === 'verified'   && <><FaCheckCircle style={{ color: '#059669' }} /> <span style={{ fontSize: '0.83rem', color: '#166534', fontWeight: 600 }}>Tài khoản đã được xác minh.</span></>}
            {kycStatus === 'pending'    && <><FaExclamationCircle style={{ color: '#d97706' }} /> <span style={{ fontSize: '0.83rem', color: '#92400e', fontWeight: 600 }}>Hồ sơ đang chờ duyệt. Admin sẽ xem xét trong 24–48 giờ.</span></>}
            {kycStatus === 'unverified' && <><FaIdCard style={{ color: '#dc2626' }} /> <span style={{ fontSize: '0.83rem', color: '#991b1b', fontWeight: 600 }}>Chưa xác minh – Vui lòng tải lên tài liệu bên dưới.</span></>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {KYC_DOCS.map(doc => (
              <div key={doc.key}>
                <label className="op-label" style={{ marginBottom: 6 }}>{doc.label}</label>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 8 }}>{doc.hint}</div>
                <FileUpload
                  accept="image/*"
                  maxFiles={2}
                  onFilesChange={() => {}}
                  label={`Tải lên ${doc.label}`}
                />
              </div>
            ))}
          </div>

          {kycStatus !== 'verified' && (
            <button className="op-btn-primary" style={{ marginTop: 20 }} onClick={handleKycSubmit}>
              <FaIdCard /> Gửi hồ sơ xác minh
            </button>
          )}
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="op-card">
          <h3 className="op-section-title">Đổi mật khẩu</h3>
          <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Mật khẩu hiện tại',     'current'],
              ['Mật khẩu mới',          'next'],
              ['Xác nhận mật khẩu mới', 'confirm'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="op-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <FaKey style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }} />
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="op-input"
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
                <FaCheckCircle /> Mật khẩu đã được cập nhật!
              </div>
            )}
            <button className="op-btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handlePwSave}>
              <FaShieldAlt /> Cập nhật mật khẩu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;
