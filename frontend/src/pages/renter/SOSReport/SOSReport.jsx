import React, { useState } from 'react';
import FileUpload from '../../../components/common/FileUpload';
import { FaPhone, FaMapMarkerAlt, FaCheckCircle, FaExclamationTriangle, FaAmbulance, FaCar } from 'react-icons/fa';
import { MdLocalPolice, MdFireTruck } from 'react-icons/md';

const INCIDENT_TYPES = [
  { id: 'accident', label: 'Tai nạn giao thông', icon: <FaCar aria-hidden="true" />, color: '#dc2626' },
  { id: 'breakdown', label: 'Xe hỏng/chết máy', icon: <FaCar aria-hidden="true" />, color: '#d97706' },
  { id: 'flat', label: 'Xịt lốp/thủng xe', icon: <FaCar aria-hidden="true" />, color: '#d97706' },
  { id: 'lock', label: 'Khóa cửa xe/mất chìa', icon: <FaCar aria-hidden="true" />, color: '#7c3aed' },
  { id: 'other', label: 'Sự cố khác', icon: <FaExclamationTriangle aria-hidden="true" />, color: '#6b7280' },
];

const HOTLINES = [
  { label: 'SmartRent Hỗ trợ', number: '1900 1234', icon: <FaPhone aria-hidden="true" />, color: '#87ceeb', desc: '24/7 – Miễn phí' },
  { label: 'Cấp cứu', number: '115', icon: <FaAmbulance aria-hidden="true" />, color: '#dc2626', desc: 'Khẩn cấp y tế' },
  { label: 'Cảnh sát', number: '113', icon: <MdLocalPolice aria-hidden="true" />, color: '#2563eb', desc: 'Tai nạn, sự cố' },
  { label: 'Cứu hỏa', number: '114', icon: <MdFireTruck aria-hidden="true" />, color: '#d97706', desc: 'Cháy nổ' },
];

const SOSReport = () => {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [locationShared, setLocationShared] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => setLocationShared(true), () => setLocationShared(true));
    } else setLocationShared(true);
  };

  const handleSubmit = () => {
    if (!incidentType) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="sos-page" aria-live="polite">
        <div className="sos-success">
          <div className="sos-success-icon"><FaCheckCircle aria-hidden="true" /></div>
          <h2>Báo cáo đã được gửi!</h2>
          <p>Đội hỗ trợ SmartRent đã nhận được báo cáo của bạn và sẽ liên hệ trong vòng <b>5 phút</b>.</p>
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, width: '100%', marginBottom: 20 }}>
            {[['Mã báo cáo', 'SOS' + Date.now().toString().slice(-6)], ['Loại sự cố', INCIDENT_TYPES.find(i => i.id === incidentType)?.label || incidentType], ['Thời gian', new Date().toLocaleString('vi-VN')], ['Trạng thái', 'Đang xử lý']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                <span style={{ color: '#9ca3af' }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="hotline-grid">
            {HOTLINES.map(h => (
              <a key={h.label} href={`tel:${h.number}`} className="hotline-card" style={{ borderColor: h.color + '40', background: h.color + '08' }}>
                <div className="hotline-icon" style={{ color: h.color, background: h.color + '15' }}>{h.icon}</div>
                <div className="hotline-label">{h.label}</div>
                <div className="hotline-number" style={{ color: h.color }}>{h.number}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sos-page">
      {/* Header */}
      <div className="sos-header">
        <div className="sos-header-icon"><FaExclamationTriangle aria-hidden="true" /></div>
        <div>
          <h1 className="sos-title">Báo cáo sự cố khẩn cấp</h1>
          <p className="sos-sub">Hotline hỗ trợ 24/7: <a href="tel:19001234" className="sos-phone">1900 1234</a></p>
        </div>
      </div>

      {/* Quick call buttons */}
      <div className="hotline-grid" style={{ marginBottom: 24 }}>
        {HOTLINES.map(h => (
          <a key={h.label} href={`tel:${h.number}`} className="hotline-card" style={{ borderColor: h.color + '40', background: h.color + '08' }}>
            <div className="hotline-icon" style={{ color: h.color, background: h.color + '15' }}>{h.icon}</div>
            <div className="hotline-label">{h.label}</div>
            <div className="hotline-number" style={{ color: h.color }}>{h.number}</div>
            <div className="hotline-desc">{h.desc}</div>
          </a>
        ))}
      </div>

      {/* Report form */}
      <div className="sos-form-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: 16 }}>Gửi báo cáo sự cố</h3>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label" id="incident-type-label">Loại sự cố *</label>
          <div
            role="radiogroup"
            aria-labelledby="incident-type-label"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}
          >
            {INCIDENT_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={incidentType === t.id}
                onClick={() => setIncidentType(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                  border: `2px solid ${incidentType === t.id ? t.color : '#e5e7eb'}`,
                  background: incidentType === t.id ? t.color + '10' : '#fff',
                  color: incidentType === t.id ? t.color : '#374151',
                  fontWeight: incidentType === t.id ? 700 : 500,
                  cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label" htmlFor="sos-description">Mô tả sự cố</label>
          <textarea
            id="sos-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Mô tả chi tiết tình huống (vị trí, tình trạng xe, thương tích nếu có…)"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Chia sẻ vị trí</label>
          {!locationShared ? (
            <button
              type="button"
              onClick={shareLocation}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <FaMapMarkerAlt aria-hidden="true" /> Chia sẻ vị trí hiện tại
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, color: '#0284c7', fontSize: '0.85rem', fontWeight: 600 }}>
              <FaCheckCircle aria-hidden="true" /> Đã chia sẻ vị trí
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <FileUpload label="Ảnh hiện trường" multiple hint="Chụp ảnh xe, vết va chạm, biển báo khu vực – tối đa 10 ảnh" />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!incidentType}
          style={{ width: '100%', padding: '13px 0', background: incidentType ? '#dc2626' : '#e5e7eb', color: incidentType ? '#fff' : '#9ca3af', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem', cursor: incidentType ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <FaExclamationTriangle aria-hidden="true" /> Gửi báo cáo sự cố
        </button>
      </div>
    </div>
  );
};

export default SOSReport;
