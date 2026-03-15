import React, { useState } from 'react';
import FileUpload from '../../../components/common/FileUpload';
import { FaSave, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import '../../admin/AdminDashboard/AdminDashboard.css';

const ShowroomProfile = () => {
  const [form, setForm] = useState({
    name: 'Showroom Minh Hoàng', owner: 'Phạm Thị Dung', phone: '028 1234 5678',
    email: 'minhhoang@smartrent.vn', address: '123 Lê Văn Lương, Quận 7, TP.HCM',
    description: 'Showroom chuyên cho thuê xe du lịch chất lượng cao, phục vụ cá nhân và doanh nghiệp. Xe đời mới, đa dạng phân khúc, giá cả cạnh tranh.',
    openHours: '07:00 – 21:00', license: 'GP001/2026',
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Hồ sơ Showroom</h1>
          <p className="page-subtitle">Quản lý thông tin và cài đặt showroom</p>
        </div>
        <button className="btn-primary" onClick={handleSave}><FaSave /> {saved ? 'Đã lưu!' : 'Lưu thay đổi'}</button>
      </div>

      {/* Header Card */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: '#00b14f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, flexShrink: 0 }}>M</div>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{form.name}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 4 }}>
            <FaMapMarkerAlt style={{ marginRight: 4 }} />{form.address}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.8rem', opacity: 0.8 }}>
            <span><FaStar style={{ color: '#f59e0b' }} /> 4.8 · 156 đánh giá</span>
            <span>45 xe · 312 chuyến</span>
            <span style={{ background: '#00b14f', padding: '2px 10px', borderRadius: 50, opacity: 1, fontWeight: 700 }}>Đã xác minh ✓</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        {[['info', 'Thông tin cơ bản'], ['policy', 'Chính sách'], ['logo', 'Logo & Hình ảnh']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: activeTab === key ? '#fff' : 'transparent', fontWeight: 600, fontSize: '0.82rem', color: activeTab === key ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: activeTab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #f0f0f0' }}>
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Tên showroom', 'name'], ['Tên chủ sở hữu', 'owner'],
              ['Số điện thoại', 'phone'], ['Email', 'email'],
              ['Giờ mở cửa', 'openHours'], ['Giấy phép kinh doanh', 'license'],
            ].map(([label, key]) => (
              <div key={key}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Địa chỉ</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}
        {activeTab === 'policy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['Yêu cầu đặt cọc', '20% tổng giá trị chuyến đi'],
              ['Phụ phí vượt km', '3.000đ/km sau 200km'],
              ['Phụ phí trả muộn', '50.000đ/giờ'],
              ['Chính sách hủy đặt', 'Miễn phí trước 24h, 50% sau 24h'],
            ].map(([label, val]) => (
              <div key={label}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
                <input defaultValue={val} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        )}
        {activeTab === 'logo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div><div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem', color: '#111827' }}>Logo Showroom</div><FileUpload hint="PNG, JPG – 512x512px khuyến nghị" /></div>
            <div><div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem', color: '#111827' }}>Ảnh showroom</div><FileUpload multiple hint="Ảnh mặt tiền, không gian showroom – tối đa 8 ảnh" /></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowroomProfile;
