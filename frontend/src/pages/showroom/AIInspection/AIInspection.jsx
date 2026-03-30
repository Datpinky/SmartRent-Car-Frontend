import React, { useState } from 'react';
import FileUpload from '../../../components/common/FileUpload';
import ImageCompareSlider from '../../../components/common/ImageCompareSlider';
import StatusBadge from '../../../components/common/StatusBadge';
import { FaRobot, FaCamera, FaCheckCircle, FaExclamationTriangle, FaHistory, FaCar } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';

const MOCK_DAMAGES = [
  { id: 1, x: 25, y: 30, w: 12, h: 10, label: 'Vết trầy xước', location: 'Cánh cửa trước bên trái', severity: 'medium', severityLabel: 'Trung bình', description: 'Vết xước dài ~15cm, lộ kim loại', cost: '800.000 – 1.500.000đ' },
  { id: 2, x: 60, y: 55, w: 8, h: 8,  label: 'Vết lõm nhỏ',    location: 'Cản sau',                 severity: 'low',    severityLabel: 'Nhẹ',       description: 'Vết lõm đường kính ~5cm', cost: '300.000 – 600.000đ' },
];

const INSPECTION_HISTORY = [
  { id: 1, booking: 'BK0004', vehicle: 'VinFast VF8 Eco', renter: 'Hoàng Văn Em', date: '11/03/2026', damages: 0, status: 'clean' },
  { id: 2, booking: 'BK0003', vehicle: 'Mazda CX-5 Premium', renter: 'Lê Minh Cường', date: '09/03/2026', damages: 2, status: 'damaged' },
  { id: 3, booking: 'BK0001', vehicle: 'Toyota Camry 2.5Q', renter: 'Nguyễn Văn An', date: '08/03/2026', damages: 0, status: 'clean' },
];

const AIInspection = () => {
  const [tab, setTab] = useState('new');
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [, setBeforeFiles] = useState([]);
  const [, setAfterFiles] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); setStep(3); }, 2000);
  };

  return (
    <div className="ai-inspection">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Kiểm tra AI – So sánh xe</h1>
          <p className="page-subtitle">Sử dụng AI để phát hiện hư hỏng trước và sau khi thuê xe</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        {[['new', <FaCamera />, 'Kiểm tra mới'], ['history', <FaHistory />, 'Lịch sử kiểm tra']].map(([key, icon, label]) => (
          <button key={key} className={`ai-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="ai-content">
          {/* Steps */}
          <div className="ai-steps">
            {[['1', 'Chọn xe & booking'], ['2', 'Tải ảnh'], ['3', 'Kết quả AI']].map(([num, label], i) => (
              <React.Fragment key={num}>
                <div className={`ai-step ${step >= parseInt(num) ? 'active' : ''} ${step > parseInt(num) ? 'done' : ''}`}>
                  <div className="ai-step-num">{step > parseInt(num) ? <FaCheckCircle /> : num}</div>
                  <span>{label}</span>
                </div>
                {i < 2 && <div className={`ai-step-line ${step > parseInt(num) ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="ai-card">
              <h3 className="ai-card-title">Chọn xe cần kiểm tra</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
                {['Toyota Camry 2.5Q – BK0001', 'Honda CR-V L – BK0004', 'Kia Carnival – BK0007'].map(v => (
                  <div key={v} onClick={() => setSelectedVehicle(v)} style={{ padding: 14, borderRadius: 12, border: `2px solid ${selectedVehicle === v ? '#00b14f' : '#e5e7eb'}`, background: selectedVehicle === v ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FaCar style={{ color: '#00b14f', fontSize: '1.2rem' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{v}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary" disabled={!selectedVehicle} onClick={() => setStep(2)} style={{ opacity: selectedVehicle ? 1 : 0.5 }}>
                Tiếp theo →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="ai-card">
              <h3 className="ai-card-title">Tải ảnh xe: {selectedVehicle}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ background: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', padding: '2px 9px', borderRadius: 50 }}>TRƯỚC</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ảnh khi giao xe</span>
                  </div>
                  <FileUpload multiple hint="Chụp nhiều góc (trước, sau, 2 bên, nội thất)" onUpload={setBeforeFiles} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', padding: '2px 9px', borderRadius: 50 }}>SAU</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ảnh khi nhận lại xe</span>
                  </div>
                  <FileUpload multiple hint="Chụp nhiều góc tương ứng với ảnh trước thuê" onUpload={setAfterFiles} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" onClick={() => setStep(1)}>← Quay lại</button>
                <button className="btn-primary" onClick={handleAnalyze} disabled={analyzing} style={{ minWidth: 160 }}>
                  {analyzing ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 6 }} />Đang phân tích AI...</> : <><FaRobot /> Phân tích AI</>}
                </button>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Step 3 - Results */}
          {step === 3 && analyzed && (
            <div className="ai-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#fef3c7', borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdWarning style={{ color: '#d97706', fontSize: '1.2rem' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>AI phát hiện {MOCK_DAMAGES.length} hư hỏng mới</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Độ tin cậy: 87% – Cần xác nhận thủ công</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>So sánh ảnh Before / After</div>
                <ImageCompareSlider damages={MOCK_DAMAGES} />
              </div>

              {/* Damage list */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Chi tiết hư hỏng</div>
                {MOCK_DAMAGES.map((d, i) => (
                  <div key={d.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ background: '#fef3c7', color: '#d97706', fontWeight: 700, fontSize: '0.72rem', padding: '2px 7px', borderRadius: 50 }}>#{i + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{d.label}</span>
                      <StatusBadge status={d.severity === 'high' ? 'rejected' : d.severity === 'medium' ? 'pending' : 'new'} customLabel={d.severityLabel} />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      <div><b>Vị trí:</b> {d.location}</div>
                      <div><b>Chi phí dự kiến:</b> {d.cost}</div>
                      <div style={{ gridColumn: 'span 2' }}><b>Mô tả:</b> {d.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn-outline" onClick={() => { setStep(1); setAnalyzed(false); setSelectedVehicle(''); }}>Kiểm tra mới</button>
                <button className="btn-primary">Tạo báo cáo & Gửi khách</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0' }}>
          <table className="simple-table">
            <thead><tr><th>Booking</th><th>Xe</th><th>Khách thuê</th><th>Ngày kiểm tra</th><th>Hư hỏng</th><th>Kết quả</th></tr></thead>
            <tbody>
              {INSPECTION_HISTORY.map(h => (
                <tr key={h.id}>
                  <td><span className="code-badge">{h.booking}</span></td>
                  <td style={{ fontWeight: 500 }}>{h.vehicle}</td>
                  <td>{h.renter}</td>
                  <td>{h.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    {h.damages > 0
                      ? <span style={{ fontWeight: 700, color: '#dc2626' }}>{h.damages} vết</span>
                      : <span style={{ color: '#059669', fontWeight: 600 }}>0</span>
                    }
                  </td>
                  <td>
                    {h.status === 'clean'
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}><FaCheckCircle /> Không hư hỏng</span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}><FaExclamationTriangle /> Phát hiện hư hỏng</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AIInspection;
