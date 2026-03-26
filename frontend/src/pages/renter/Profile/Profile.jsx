import React, { useState, useRef } from 'react';
import FileUpload from '../../../components/common/FileUpload';
import StatusBadge from '../../../components/common/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaIdCard, FaCheckCircle, FaUser, FaShieldAlt,
  FaCamera, FaEdit, FaPhone, FaEnvelope, FaBirthdayCake,
  FaMapMarkerAlt, FaSyncAlt, FaCheck, FaTimes
} from 'react-icons/fa';
import { MdVerifiedUser } from 'react-icons/md';

/* ── Hiển thị một dòng thông tin ── */
const InfoRow = ({ icon, label, value }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '13px 0',
    borderBottom: '1px solid #f3f4f6',
  }}>
    <div style={{
      width: 34,
      height: 34,
      borderRadius: 9,
      background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: '#059669',
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
  const [kycStatus, setKycStatus] = useState('unverified');
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

  const handleKycSubmit = () => setKycStatus('pending');

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const fields = [
    { icon: <FaUser />, label: 'Họ và tên', key: 'name', type: 'text' },
    { icon: <FaEnvelope />, label: 'Email', key: 'email', type: 'email', readonly: true },
    {
      icon: <FaPhone />, label: 'Số điện thoại', key: 'phone', type: 'tel',
      inputProps: { maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }
    },
    { icon: <FaBirthdayCake />, label: 'Ngày sinh', key: 'dob', type: 'text' },
  ];

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Hồ sơ cá nhân</h1>
          <p className="page-subtitle">Quản lý thông tin và xác minh danh tính</p>
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
          <button className="profile-avatar-edit" onClick={() => fileRef.current.click()} title="Đổi ảnh đại diện">
            <FaCamera style={{ fontSize: '0.6rem' }} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name">{form.name || user?.name}</div>
          <div className="profile-hero-email">{form.email || user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status={kycStatus} />
            <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.08)', padding: '2px 10px', borderRadius: 20 }}>
              Thành viên từ tháng 1, 2026
            </span>
          </div>
        </div>

        <div className="profile-hero-stats">
          <div className="profile-stat">
            <div className="profile-stat-val">8</div>
            <div className="profile-stat-label">Chuyến đã thuê</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />
          <div className="profile-stat">
            <div className="profile-stat-val">4.9</div>
            <div className="profile-stat-label">Đánh giá TB</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />
          <div className="profile-stat">
            <div className="profile-stat-val">0</div>
            <div className="profile-stat-label">Báo cáo vi phạm</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {[
          ['info', <FaUser />, 'Thông tin'],
          ['kyc', <FaIdCard />, 'Xác minh danh tính'],
          ['security', <FaShieldAlt />, 'Bảo mật'],
        ].map(([key, icon, label]) => (
          <button key={key} className={`profile-tab ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setIsEditing(false); }}>
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
                onClick={handleStartEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                  border: '1.5px solid #6ee7b7',
                  borderRadius: 10,
                  padding: '8px 18px',
                  fontSize: '0.83rem',
                  fontWeight: 700,
                  color: '#059669',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #d1fae5, #a7f3d0)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #ecfdf5, #d1fae5)'}
              >
                <FaEdit style={{ fontSize: '0.78rem' }} />
                Chỉnh sửa
              </button>
            )}
          </div>

          {/* Thông báo đã lưu */}
          {saved && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              border: '1px solid #6ee7b7',
              borderRadius: 10,
              padding: '11px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#059669',
              animation: 'fadeIn 0.3s ease',
            }}>
              <FaCheck />
              Thông tin đã được cập nhật thành công!
            </div>
          )}

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
                {fields.map(({ icon, label, key, type, readonly, inputProps }) => (
                  <div key={key}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: '#059669', fontSize: '0.7rem' }}>{icon}</span>
                      {label}
                    </label>
                    <input
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
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaMapMarkerAlt style={{ color: '#059669', fontSize: '0.7rem' }} />
                    Địa chỉ
                  </label>
                  <input
                    value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    className="form-input"
                    placeholder="Nhập địa chỉ của bạn..."
                  />
                </div>

                {/* Bio — full width */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Giới thiệu bản thân</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => handleFieldChange('bio', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Viết vài dòng giới thiệu về bạn (không bắt buộc)..."
                    style={{ resize: 'vertical', minHeight: 76, lineHeight: 1.65 }}
                  />
                </div>

                {/* Lỗi */}
                {formError && (
                  <div style={{
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
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    minWidth: 172,
                    justifyContent: 'center',
                    padding: '10px 22px',
                    fontSize: '0.88rem',
                    opacity: saving ? 0.85 : 1,
                    boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? (
                    <>
                      <FaSyncAlt style={{ fontSize: '0.8rem', animation: 'spin 0.8s linear infinite' }} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaCheck style={{ fontSize: '0.8rem' }} />
                      Cập nhật thông tin
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KYC TAB ── */}
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

      {/* ── SECURITY TAB ── */}
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
