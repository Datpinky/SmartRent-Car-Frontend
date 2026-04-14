import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaEdit, FaMapMarkerAlt, FaSave, FaSpinner, FaUser } from 'react-icons/fa';
import { MdAlternateEmail, MdInfoOutline, MdPhoneIphone } from 'react-icons/md';
import CarLocationMap from '../../../components/Map/CarLocationMap';
import { useAuth } from '../../../contexts/AuthContext';
import mapService from '../../../services/mapService';
import profileService from '../../../services/profileService';
import userLocationService from '../../../services/userLocationService';

const ROLE_LABELS = {
  renter: 'Khách thuê',
  owner: 'Chủ xe',
  showroom: 'Showroom',
  admin: 'Quản trị',
};

const buildInitialForm = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  address: user?.address || '',
});

const Profile = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const userId = user?._id || user?.id || '';

  const [form, setForm] = useState(buildInitialForm(user));
  const [isEditing, setIsEditing] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [notice, setNotice] = useState({ type: '', message: '' });

  useEffect(() => {
    setForm(buildInitialForm(user));
  }, [user]);

  useEffect(() => {
    refreshUser().catch(() => { });
  }, [refreshUser]);

  const loadSavedLocation = useCallback(async () => {
    if (!userId) {
      setSavedLocation(null);
      return;
    }

    setLoadingLocation(true);
    try {
      const location = await userLocationService.getByUserId(userId);
      setSavedLocation(location || null);
    } catch {
      setSavedLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSavedLocation();
  }, [loadSavedLocation]);

  const initials = useMemo(
    () => user?.name?.split(' ').map((word) => word[0]).slice(-2).join('').toUpperCase() || 'U',
    [user?.name]
  );

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleStartEdit = () => {
    setForm(buildInitialForm(user));
    setNotice({ type: '', message: '' });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setForm(buildInitialForm(user));
    setNotice({ type: '', message: '' });
    setIsEditing(false);
  };

  const validateForm = () => {
    if (!String(form.name || '').trim()) {
      return 'Vui lòng nhập họ và tên.';
    }

    const phone = String(form.phone || '').trim();
    if (phone && !/^[0-9+\s-]{8,15}$/.test(phone)) {
      return 'Số điện thoại không hợp lệ.';
    }

    return '';
  };

  const syncUserLocation = async (profileAddress) => {
    const trimmedAddress = String(profileAddress || '').trim();

    if (!trimmedAddress) {
      try {
        await userLocationService.remove(userId);
      } catch {
        // Nothing to remove.
      }
      setSavedLocation(null);
      return {
        type: 'success',
        message: 'Đã lưu hồ sơ.',
      };
    }

    const geocodeResults = await mapService.forwardGeocode(trimmedAddress);
    if (!geocodeResults.length) {
      setSavedLocation(null);
      return {
        type: 'warning',
        message: 'Đã lưu hồ sơ, nhưng không tìm thấy tọa độ cho địa chỉ này.',
      };
    }

    const bestMatch = geocodeResults[0];
    const payload = {
      address: bestMatch.address || trimmedAddress,
      latitude: String(bestMatch.lat),
      longitude: String(bestMatch.lng),
      plus_code: bestMatch.plusCode || '',
    };

    let nextLocation = null;
    try {
      nextLocation = savedLocation?.id
        ? await userLocationService.update(userId, payload)
        : await userLocationService.create(userId, payload);
    } catch {
      nextLocation = await userLocationService.update(userId, payload);
    }

    setSavedLocation(nextLocation || null);
    return {
      type: 'success',
      message: 'Cập nhật thành công',
    };
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setNotice({ type: 'error', message: validationError });
      return;
    }

    if (!userId) {
      setNotice({ type: 'error', message: 'Không tìm thấy thông tin tài khoản để cập nhật.' });
      return;
    }

    setSaving(true);
    setNotice({ type: '', message: '' });

    try {
      const updatedProfile = await profileService.updateProfile(userId, {
        name: String(form.name || '').trim(),
        phone: String(form.phone || '').trim(),
        address: String(form.address || '').trim(),
      });

      updateUser(updatedProfile);
      setForm(buildInitialForm(updatedProfile));

      const locationResult = await syncUserLocation(updatedProfile.address);
      setNotice(locationResult);
      setIsEditing(false);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Không thể cập nhật hồ sơ lúc này.',
      });
    } finally {
      setSaving(false);
    }
  };

  const previewMap = savedLocation ? (
    <CarLocationMap
      locationText={savedLocation.address || form.address}
      lat={savedLocation.latitude}
      lng={savedLocation.longitude}
      plusCode={savedLocation.plusCode}
      showOpenMapLink
      openMapLabel="Mở trong Maps"
      mapHeight={400}
    />
  ) : null;

  const noticeStyles = {
    success: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#166534',
    },
    warning: {
      background: '#fffbeb',
      border: '1px solid #fde68a',
      color: '#92400e',
    },
    error: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#b91c1c',
    },
  };

  return (
    <div className="profile-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Hồ sơ cá nhân</h1>
        </div>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-big">{initials}</div>
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name">{user?.name || 'Không có dữ liệu'}</div>
          <div className="profile-hero-email">{user?.email || 'Không có dữ liệu'}</div>
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
            {loadingLocation ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
            {savedLocation ? 'Đã cập nhật vị trí' : 'Chưa có vị trí'}
          </div>
        </div>
      </div>

      {notice.message && (
        <div
          style={{
            ...(noticeStyles[notice.type] || noticeStyles.success),
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: '0.84rem',
          }}
        >
          {notice.message}
        </div>
      )}

      <div className="profile-card">
        <div style={{ marginBottom: 18 }}>
          <h3 className="profile-section-title" style={{ marginBottom: 0 }}>Thông tin cá nhân</h3>
        </div>

        <div className="profile-form-grid">
          <div>
            <label className="form-label">Họ và tên</label>
            <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#6b7280' }}><FaUser /></span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                disabled={!isEditing}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb' }}>
              <span style={{ color: '#6b7280' }}><MdAlternateEmail /></span>
              <span>{user?.email || 'Không có dữ liệu'}</span>
            </div>
          </div>

          <div>
            <label className="form-label">Số điện thoại</label>
            <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#6b7280' }}><MdPhoneIphone /></span>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                disabled={!isEditing}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Vai trò</label>
            <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb' }}>
              <span style={{ color: '#6b7280' }}><MdInfoOutline /></span>
              <span>{ROLE_LABELS[user?.role] || user?.role || 'Không có dữ liệu'}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="form-label">Địa chỉ</label>
          <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#6b7280' }}><FaMapMarkerAlt /></span>
            <input
              type="text"
              value={form.address}
              onChange={(event) => handleChange('address', event.target.value)}
              disabled={!isEditing}
              placeholder="Nhập địa chỉ của bạn"
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 className="profile-section-title" style={{ marginBottom: 12 }}>Vị trí của bạn</h3>
          {loadingLocation ? (
            <div
              style={{
                minHeight: 220,
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                gap: 8,
              }}
            >
              <FaSpinner className="animate-spin" />
              Đang tải vị trí của bạn...
            </div>
          ) : previewMap ? (
            previewMap
          ) : (
            <div
              style={{
                minHeight: 220,
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#9ca3af',
                padding: 24,
              }}
            >
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="form-label">Mã tài khoản</label>
          <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', fontFamily: 'monospace' }}>
            <span style={{ color: '#6b7280' }}><MdInfoOutline /></span>
            <span>{user?._id || 'Không có dữ liệu'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          {isEditing ? (
            <>
              <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Lưu thông tin
              </button>
              <button className="btn-secondary" type="button" onClick={handleCancelEdit} disabled={saving}>
                Hủy chỉnh sửa
              </button>
            </>
          ) : (
            <button className="btn-primary" type="button" onClick={handleStartEdit}>
              <FaEdit /> Chỉnh sửa thông tin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
