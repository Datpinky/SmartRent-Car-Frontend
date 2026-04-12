import React, { useEffect, useMemo } from 'react';
import { FaDatabase, FaUser } from 'react-icons/fa';
import { MdAlternateEmail, MdInfoOutline, MdPhoneIphone } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';

const ROLE_LABELS = {
  renter: 'Khach thue',
  owner: 'Chu xe',
  showroom: 'Showroom',
  admin: 'Quan tri',
};

const READ_ONLY_FIELDS = [
  {
    key: 'name',
    label: 'Ho va ten',
    icon: <FaUser />,
    getValue: (user) => user?.name || 'Khong co du lieu',
  },
  {
    key: 'email',
    label: 'Email',
    icon: <MdAlternateEmail />,
    getValue: (user) => user?.email || 'Khong co du lieu',
  },
  {
    key: 'phone',
    label: 'So dien thoai',
    icon: <MdPhoneIphone />,
    getValue: (user) => user?.phone || 'Khong co du lieu',
  },
  {
    key: 'role',
    label: 'Vai tro',
    icon: <FaDatabase />,
    getValue: (user) => ROLE_LABELS[user?.role] || user?.role || 'Khong co du lieu',
  },
  {
    key: '_id',
    label: 'Ma tai khoan',
    icon: <MdInfoOutline />,
    getValue: (user) => user?._id || 'Khong co du lieu',
    mono: true,
  },
];

const DB_SCOPE_FIELDS = [
  'Avatar anh',
  'Dia chi',
  'Ngay sinh',
  'KYC/CCCD/GPLX',
  'Doi mat khau truc tiep trong ho so',
];

const ReadOnlyField = ({ label, value, icon, mono = false }) => (
  <div>
    <label className="form-label">{label}</label>
    <div
      className="form-input"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 46,
        background: '#f9fafb',
        color: '#111827',
        fontFamily: mono ? 'monospace' : 'inherit',
        overflowWrap: 'anywhere',
      }}
    >
      <span style={{ color: '#6b7280', display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span>{value}</span>
    </div>
  </div>
);

const Profile = () => {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const initials = useMemo(
    () => user?.name?.split(' ').map((word) => word[0]).slice(-2).join('').toUpperCase() || 'U',
    [user?.name]
  );

  const profileFields = useMemo(() => {
    const fields = READ_ONLY_FIELDS.map((field) => ({
      ...field,
      value: field.getValue(user),
    }));

    if (user?.business_name) {
      fields.push({
        key: 'business_name',
        label: 'Ten doanh nghiep',
        icon: <FaDatabase />,
        value: user.business_name,
      });
    }

    return fields;
  }, [user]);

  return (
    <div className="profile-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Ho so ca nhan</h1>
          <p className="page-subtitle">
            Frontend dang goi backend auth de dong bo lai thong tin renter hien tai tu DB.
          </p>
        </div>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-big">{initials}</div>
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name">{user?.name || 'Khong co du lieu'}</div>
          <div className="profile-hero-email">{user?.email || 'Khong co du lieu'}</div>
          <div
            style={{
              marginTop: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1d4ed8',
            }}
          >
            <FaDatabase />
            Da dong bo qua API auth
          </div>
        </div>
      </div>

      <div className="profile-card">
        <h3 className="profile-section-title">Thong tin renter tu DB</h3>

        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            color: '#1d4ed8',
            fontSize: '0.82rem',
          }}
        >
          UI nay da bo han cac form luu local. Ho so renter duoc refresh lai tu backend qua token dang nhap khi mo app va khi vao trang ho so.
        </div>

        <div className="profile-form-grid">
          {profileFields.map((field) => (
            <ReadOnlyField
              key={field.key}
              label={field.label}
              value={field.value}
              icon={field.icon}
              mono={field.mono}
            />
          ))}
        </div>
      </div>

      <div className="profile-card">
        <h3 className="profile-section-title">Nhung muc chua co trong API hien tai</h3>

        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            color: '#c2410c',
            fontSize: '0.82rem',
          }}
        >
          Backend hien tai khong tra ve cac field ben duoi cho renter, nen frontend khong con hien thi nhu du lieu that.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {DB_SCOPE_FIELDS.map((item) => (
            <div
              key={item}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: 14,
                background: '#f9fafb',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
