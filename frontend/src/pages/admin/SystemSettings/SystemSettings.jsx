import React, { useState } from 'react';
import { FaSave, FaCog, FaBell, FaShieldAlt, FaMoneyBillWave } from 'react-icons/fa';

const SECTIONS = [
  { key: 'general', label: 'Cài đặt chung', icon: <FaCog /> },
  { key: 'payment', label: 'Thanh toán', icon: <FaMoneyBillWave /> },
  { key: 'notification', label: 'Thông báo', icon: <FaBell /> },
  { key: 'security', label: 'Bảo mật', icon: <FaShieldAlt /> },
];

const InputRow = ({ label, value, type = 'text', hint, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{label}</label>
    <input type={type} defaultValue={value} onChange={onChange}
      style={{ border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.85rem', outline: 'none', color: '#111827' }}
    />
    {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{hint}</div>}
  </div>
);

const ToggleRow = ({ label, checked, hint }) => {
  const [on, setOn] = useState(checked);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{hint}</div>}
      </div>
      <button onClick={() => setOn(!on)} style={{ width: 44, height: 24, borderRadius: 50, border: 'none', background: on ? '#00b14f' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
};

const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Cài đặt hệ thống</h1>
          <p className="page-subtitle">Quản lý cấu hình và thông số hoạt động của nền tảng</p>
        </div>
        <button className="btn-primary" onClick={handleSave}><FaSave /> {saved ? 'Đã lưu!' : 'Lưu thay đổi'}</button>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 8, border: '1px solid #f0f0f0' }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, border: 'none', background: activeSection === s.key ? '#f0fdf4' : 'transparent', color: activeSection === s.key ? '#00b14f' : '#374151', fontWeight: activeSection === s.key ? 700 : 500, fontSize: '0.83rem', cursor: 'pointer', textAlign: 'left' }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #f0f0f0' }}>
          {activeSection === 'general' && <>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Cài đặt chung</h3>
            <InputRow label="Tên nền tảng" value="SmartRent Car" hint="Tên hiển thị trên toàn bộ hệ thống" />
            <InputRow label="Email liên hệ" value="support@smartrent.vn" type="email" />
            <InputRow label="Hotline hỗ trợ" value="1900 1234" />
            <InputRow label="Phí dịch vụ (%)" value="5" type="number" hint="Phần trăm phí dịch vụ trên mỗi giao dịch" />
          </>}
          {activeSection === 'payment' && <>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Cài đặt thanh toán</h3>
            <ToggleRow label="Thanh toán qua Ví điện tử" checked={true} hint="MoMo, ZaloPay, VNPay" />
            <ToggleRow label="Thanh toán thẻ tín dụng/ghi nợ" checked={true} hint="Visa, Mastercard, JCB" />
            <ToggleRow label="Chuyển khoản ngân hàng" checked={true} />
            <InputRow label="Số tài khoản nhận tiền" value="0123456789" />
            <InputRow label="Ngân hàng" value="Vietcombank" />
          </>}
          {activeSection === 'notification' && <>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Cài đặt thông báo</h3>
            <ToggleRow label="Thông báo đặt xe mới" checked={true} />
            <ToggleRow label="Thông báo thanh toán" checked={true} />
            <ToggleRow label="Nhắc nhở trả xe" checked={true} hint="Gửi 2h trước giờ trả xe" />
            <ToggleRow label="Cảnh báo AI hư hỏng" checked={true} />
            <ToggleRow label="Email thông báo" checked={false} hint="Gửi email thay vì push notification" />
          </>}
          {activeSection === 'security' && <>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Bảo mật</h3>
            <ToggleRow label="Xác thực 2 yếu tố (2FA)" checked={true} hint="Bắt buộc với tài khoản Admin" />
            <ToggleRow label="Yêu cầu xác minh eKYC" checked={true} hint="Bắt buộc trước khi đặt xe" />
            <ToggleRow label="Phiên đăng nhập tự động hết hạn" checked={true} />
            <InputRow label="Thời gian phiên (phút)" value="120" type="number" />
            <ToggleRow label="Mã hóa SSL/TLS" checked={true} hint="Tự động với HTTPS" />
          </>}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
