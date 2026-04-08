import React, { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaCheckCircle, FaUser, FaShieldAlt,
  FaCamera, FaEdit, FaPhone, FaEnvelope, FaBirthdayCake,
  FaMapMarkerAlt, FaSyncAlt, FaCheck
} from 'react-icons/fa';

/* ── Hiển thị một dòng thông tin ── */
const InfoRow = ({ icon, label, value }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '13px 0',
    borderBottom: '1px solid #f3f4f6',
  }}>
    <div
      aria-hidden="true"
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#0284c7',
        fontSize: '0.82rem',
      }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.73rem', color: '#9ca3af', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, wordBreak: 'break-word' }}>
        {value || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontWeight: 400 }}>Chưa cập nhật</span>}
      </div>
    </div>
  </div>
);

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');

  const defaultForm = {
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    dob: '01/01/1995',
    address: '123 Nguyễn Trãi, Q.1, TP.HCM',
    bio: '',
  };

  const [form, setForm] = useState(defaultForm);
  const [editForm, setEditForm] = useState(defaultForm);      // bản nháp khi đang sửa
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef();

  /* ── Mở chế độ chỉnh sửa ── */
  const handleStartEdit = () => {
    setEditForm({ ...form });
    setFormError('');
    setSaved(false);
    setIsEditing(true);
  };

  /* ── Huỷ chỉnh sửa ── */
  const handleCancel = () => {
    setEditForm({ ...form });
    setFormError('');
    setIsEditing(false);
  };

  /* ── Thay đổi trường ── */
  const handleFieldChange = (key, value) => {
    if (key === 'phone') {
      const digits = String(value).replace(/\D/g, '').slice(0, 10);
      setEditForm(f => ({ ...f, phone: digits }));
      return;
    }
    setEditForm(f => ({ ...f, [key]: value }));
  };

  /* ── Lưu ── */
  const handleSave = async () => {
    const phoneDigits = (editForm.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setFormError('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }
    setFormError('');
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    updateUser({ name: editForm.name, phone: editForm.phone });
    setForm({ ...editForm });
    setSaving(false);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const fields = [
    { icon: <FaUser />, label: 'Họ và tên', key: 'name', type: 'text', id: 'profile-name', name: 'name', autoComplete: 'name' },
    { icon: <FaEnvelope />, label: 'Email', key: 'email', type: 'email', readonly: true, id: 'profile-email', name: 'email', autoComplete: 'email' },
    {
      icon: <FaPhone />, label: 'Số điện thoại', key: 'phone', type: 'tel',
      inputProps: { maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' },
      id: 'profile-phone', name: 'tel', autoComplete: 'tel'
    },
    { icon: <FaBirthdayCake />, label: 'Ngày sinh', key: 'dob', type: 'text', id: 'profile-dob', name: 'bday', autoComplete: 'bday' },
  ];

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Hồ sơ cá nhân</h1>
          <p className="page-subtitle">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>
      </div>

      {/* ── Profile Hero ── */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="profile-avatar-big"
              style={{ objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)' }} />
          ) : (
            <div className="profile-avatar-big">{initials}</div>
          )}
          <button
            type="button"
            className="profile-avatar-edit"
            onClick={() => fileRef.current.click()}
            title="Đổi ảnh đại diện"
            aria-label="Đổi ảnh đại diện"
          >
            <FaCamera style={{ fontSize: '0.6rem' }} aria-hidden="true" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
            aria-label="Chọn ảnh đại diện"
          />
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name">{form.name || user?.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          </div>
        </div>

        <div className="profile-hero-stats">
          <div className="profile-stat">
            <div className="profile-stat-val tabular-nums">8</div>
            <div className="profile-stat-label">Chuyến đã thuê</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />
          <div className="profile-stat">
            <div className="profile-stat-val tabular-nums">4.9</div>
            <div className="profile-stat-label">Đánh giá TB</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />
          <div className="profile-stat">
            <div className="profile-stat-val tabular-nums">0</div>
            <div className="profile-stat-label">Báo cáo vi phạm</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {[
          ['info', <FaUser aria-hidden="true" />, 'Thông tin'],
          ['security', <FaShieldAlt aria-hidden="true" />, 'Bảo mật'],
        ].map(([key, icon, label]) => (
          <button
            type="button"
            key={key}
            className={`profile-tab ${tab === key ? 'active' : ''}`}
            onClick={() => { setTab(key); setIsEditing(false); }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {tab === 'info' && (
        <div className="profile-card">

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 className="profile-section-title" style={{ marginBottom: 3 }}>
                {isEditing ? 'Chỉnh sửa thông tin' : 'Thông tin cá nhân'}
              </h3>
              <p style={{ fontSize: '0.77rem', color: '#9ca3af', margin: 0 }}>
                {isEditing
                  ? 'Thay đổi thông tin bên dưới, sau đó bấm "Cập nhật thông tin"'
                  : 'Bấm "Chỉnh sửa" để cập nhật thông tin của bạn'}
              </p>
            </div>

            {/* Nút Chỉnh sửa (chỉ hiện khi chưa edit) */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  border: '1.5px solid #7dd3fc',
                  borderRadius: 10,
                  padding: '8px 18px',
                  fontSize: '0.83rem',
                  fontWeight: 700,
                  color: '#0284c7',
                  cursor: 'pointer',
                  transition: 'background 0.18s, border-color 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #e0f2fe, #bae6fd)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff, #e0f2fe)'}
              >
                <FaEdit style={{ fontSize: '0.78rem' }} aria-hidden="true" />
                Chỉnh sửa
              </button>
            )}
          </div>

          {/* Thông báo đã lưu */}
          <div aria-live="polite">
            {saved && (
              <div role="status" style={{
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                border: '1px solid #7dd3fc',
                borderRadius: 10,
                padding: '11px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#0284c7',
                animation: 'fadeIn 0.3s ease',
              }}>
                <FaCheck aria-hidden="true" />
                Thông tin đã được cập nhật thành công!
              </div>
            )}
          </div>

          {/* ── CHẾ ĐỘ XEM ── */}
          {!isEditing && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {fields.map(({ icon, label, key }) => (
                  <InfoRow key={key} icon={icon} label={label} value={form[key]} />
                ))}
              </div>
              {/* Địa chỉ full-width */}
              <InfoRow icon={<FaMapMarkerAlt />} label="Địa chỉ" value={form.address} />
              {/* Bio */}
              {form.bio && (
                <div style={{ padding: '13px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '0.73rem', color: '#9ca3af', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Giới thiệu bản thân
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.7 }}>{form.bio}</div>
                </div>
              )}
            </div>
          )}

          {/* ── CHẾ ĐỘ SỬA ── */}
          {isEditing && (
            <div>
              <div className="profile-form-grid">
                {fields.map(({ icon, label, key, type, readonly, inputProps, id, name, autoComplete }) => (
                  <div key={key}>
                    <label className="form-label" htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: '#0284c7', fontSize: '0.7rem' }} aria-hidden="true">{icon}</span>
                      {label}
                    </label>
                    <input
                      id={id}
                      name={name}
                      autoComplete={autoComplete}
                      type={type}
                      value={editForm[key]}
                      onChange={e => handleFieldChange(key, e.target.value)}
                      className="form-input"
                      readOnly={readonly}
                      style={readonly ? { background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' } : {}}
                      {...(inputProps || {})}
                    />
                    {readonly && (
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 3, display: 'block' }}>
                        Email không thể thay đổi
                      </span>
                    )}
                  </div>
                ))}

                {/* Địa chỉ — full width */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" htmlFor="profile-address" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaMapMarkerAlt style={{ color: '#0284c7', fontSize: '0.7rem' }} aria-hidden="true" />
                    Địa chỉ
                  </label>
                  <input
                    id="profile-address"
                    name="street-address"
                    autoComplete="street-address"
                    value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    className="form-input"
                    placeholder="Nhập địa chỉ của bạn…"
                  />
                </div>

                {/* Bio — full width */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" htmlFor="profile-bio">Giới thiệu bản thân</label>
                  <textarea
                    id="profile-bio"
                    value={editForm.bio}
                    onChange={e => handleFieldChange('bio', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Viết vài dòng giới thiệu về bạn (không bắt buộc)…"
                    style={{ resize: 'vertical', minHeight: 76, lineHeight: 1.65 }}
                  />
                </div>

                {/* Lỗi */}
                {formError && (
                  <div role="alert" style={{
                    gridColumn: 'span 2',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 9,
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    ⚠ {formError}
                  </div>
                )}
              </div>

              {/* Divider + nút Cập nhật */}
              <div style={{ height: 1, background: '#f3f4f6', margin: '20px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 9,
                    border: '1.5px solid #e5e7eb',
                    background: '#fff',
                    color: '#6b7280',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Huỷ bỏ
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    minWidth: 172,
                    justifyContent: 'center',
                    padding: '10px 22px',
                    fontSize: '0.88rem',
                    opacity: saving ? 0.85 : 1,
                    boxShadow: '0 2px 8px rgba(2, 132, 199,0.25)',
                    transition: 'opacity 0.2s, box-shadow 0.2s',
                  }}
                >
                  {saving ? (
                    <>
                      <FaSyncAlt style={{ fontSize: '0.8rem', animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />
                      Đang lưu…
                    </>
                  ) : (
                    <>
                      <FaCheck style={{ fontSize: '0.8rem' }} aria-hidden="true" />
                      Cập nhật thông tin
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === 'security' && (
        <div className="profile-card">
          <h3 className="profile-section-title">Đổi mật khẩu</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 440 }}>
            {[
              ['Mật khẩu hiện tại', 'pw-current', 'current-password'],
              ['Mật khẩu mới', 'pw-new', 'new-password'],
              ['Xác nhận mật khẩu mới', 'pw-confirm', 'new-password'],
            ].map(([label, id, autoComplete]) => (
              <div key={id}>
                <label className="form-label" htmlFor={id}>{label}</label>
                <input
                  type="password"
                  id={id}
                  name={autoComplete}
                  autoComplete={autoComplete}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            ))}
            <button type="button" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Cập nhật mật khẩu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
