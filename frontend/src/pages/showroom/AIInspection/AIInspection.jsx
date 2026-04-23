import React, { useState, useEffect, useMemo } from 'react';
import FileUpload from '../../../components/common/FileUpload';
import StatusBadge from '../../../components/common/StatusBadge';
import uploadService from '../../../services/uploadService';
import { FaRobot, FaCamera, FaCheckCircle, FaExclamationTriangle, FaHistory, FaCar } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';

const INSPECTION_HISTORY = [
  { id: 1, booking: 'BK0004', vehicle: 'VinFast VF8 Eco', renter: 'Hoàng Văn Em', date: '11/03/2026', damages: 0, status: 'clean' },
  { id: 2, booking: 'BK0003', vehicle: 'Mazda CX-5 Premium', renter: 'Lê Minh Cường', date: '09/03/2026', damages: 2, status: 'damaged' },
  { id: 3, booking: 'BK0001', vehicle: 'Toyota Camry 2.5Q', renter: 'Nguyễn Văn An', date: '08/03/2026', damages: 0, status: 'clean' },
];

const SEVERITY_LABEL = {
  none: 'Không đáng kể',
  minor: 'Nhẹ',
  moderate: 'Trung bình',
  severe: 'Nặng',
};

const severityToBadge = (sev) => {
  if (sev === 'severe') return 'rejected';
  if (sev === 'moderate') return 'pending';
  if (sev === 'minor') return 'new';
  return 'new';
};

const AIInspection = () => {
  const [tab, setTab] = useState('new');
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const beforeFile = beforeFiles[0] ?? null;
  const afterFile = afterFiles[0] ?? null;

  const beforePreview = useMemo(
    () => (beforeFile && beforeFile.type?.startsWith('image/') ? URL.createObjectURL(beforeFile) : null),
    [beforeFile]
  );
  const afterPreview = useMemo(
    () => (afterFile && afterFile.type?.startsWith('image/') ? URL.createObjectURL(afterFile) : null),
    [afterFile]
  );

  useEffect(() => {
    return () => {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
    };
  }, [beforePreview, afterPreview]);

  const resetFlow = () => {
    setStep(1);
    setAnalyzed(false);
    setSelectedVehicle('');
    setBeforeFiles([]);
    setAfterFiles([]);
    setAnalysisResult(null);
    setAnalysisError('');
  };

  const handleAnalyze = async () => {
    if (!beforeFile || !afterFile) {
      setAnalysisError('Vui lòng chọn đủ một ảnh trước thuê và một ảnh khi trả xe.');
      return;
    }
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const data = await uploadService.compareVehicleDamage(beforeFile, afterFile);
      setAnalysisResult(data);
      setAnalyzed(true);
      setStep(3);
    } catch (err) {
      setAnalysisError(err.message || 'Phân tích thất bại. Vui lòng thử lại.');
    } finally {
      setAnalyzing(false);
    }
  };

  const severity = analysisResult?.severity;
  const severityLabel = SEVERITY_LABEL[severity] || severity || '—';
  const differences = Array.isArray(analysisResult?.differences) ? analysisResult.differences : [];

  return (
    <div className="ai-inspection">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Kiểm tra AI – So sánh xe</h1>
          <p className="page-subtitle">Sử dụng AI để phát hiện hư hỏng trước và sau khi thuê xe</p>
        </div>
      </div>

      <div className="ai-tabs">
        {[['new', <FaCamera aria-hidden="true" />, 'Kiểm tra mới'], ['history', <FaHistory aria-hidden="true" />, 'Lịch sử kiểm tra']].map(([key, icon, label]) => (
          <button type="button" key={key} className={`ai-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="ai-content">
          <div className="ai-steps">
            {[['1', 'Chọn xe & booking'], ['2', 'Tải ảnh'], ['3', 'Kết quả AI']].map(([num, label], i) => (
              <React.Fragment key={num}>
                <div className={`ai-step ${step >= parseInt(num, 10) ? 'active' : ''} ${step > parseInt(num, 10) ? 'done' : ''}`}>
                  <div className="ai-step-num">{step > parseInt(num, 10) ? <FaCheckCircle aria-hidden="true" /> : num}</div>
                  <span>{label}</span>
                </div>
                {i < 2 && <div className={`ai-step-line ${step > parseInt(num, 10) ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <div className="ai-card">
              <h3 className="ai-card-title">Chọn xe cần kiểm tra</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
                {['Toyota Camry 2.5Q – BK0001', 'Honda CR-V L – BK0004', 'Kia Carnival – BK0007'].map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setSelectedVehicle(v)}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: `2px solid ${selectedVehicle === v ? '#00b14f' : '#e5e7eb'}`,
                      background: selectedVehicle === v ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background-color 0.15s',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FaCar aria-hidden="true" style={{ color: '#00b14f', fontSize: '1.2rem' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{v}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button type="button" className="btn-primary" disabled={!selectedVehicle} onClick={() => setStep(2)} style={{ opacity: selectedVehicle ? 1 : 0.5 }}>
                Tiếp theo →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="ai-card">
              <h3 className="ai-card-title">Tải ảnh xe: {selectedVehicle}</h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 16 }}>
                Chọn đúng một ảnh cho mỗi cột (ảnh gốc trên máy). Ảnh sẽ được gửi lên server để phân tích AI, không tải Cloudinary ở bước này.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ background: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', padding: '2px 9px', borderRadius: 50 }}>TRƯỚC</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ảnh khi giao xe</span>
                  </div>
                  <FileUpload
                    multiple={false}
                    maxFiles={1}
                    autoUpload={false}
                    onFiles={(files) => setBeforeFiles(files || [])}
                    hint="Một ảnh rõ nét (góc tương ứng với ảnh khi trả)"
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', padding: '2px 9px', borderRadius: 50 }}>SAU</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ảnh khi nhận lại xe</span>
                  </div>
                  <FileUpload
                    multiple={false}
                    maxFiles={1}
                    autoUpload={false}
                    onFiles={(files) => setAfterFiles(files || [])}
                    hint="Một ảnh cùng góc / vị trí tương ứng nếu có thể"
                  />
                </div>
              </div>
              {analysisError && (
                <div
                  role="alert"
                  style={{
                    marginBottom: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                  }}
                >
                  {analysisError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-outline" onClick={() => { setStep(1); setAnalysisError(''); }}>
                  ← Quay lại
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={analyzing || !beforeFile || !afterFile}
                  style={{ minWidth: 160 }}
                >
                  {analyzing ? (
                    <>
                      <span
                        className="motion-reduce:animate-none"
                        style={{
                          display: 'inline-block',
                          width: 14,
                          height: 14,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                          marginRight: 6,
                        }}
                      />
                      Đang phân tích AI…
                    </>
                  ) : (
                    <>
                      <FaRobot aria-hidden="true" /> Phân tích AI
                    </>
                  )}
                </button>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {step === 3 && analyzed && analysisResult && (
            <div className="ai-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ background: analysisResult.damage_detected ? '#fef3c7' : '#ecfdf5', borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {analysisResult.damage_detected ? (
                    <MdWarning aria-hidden="true" style={{ color: '#d97706', fontSize: '1.2rem' }} />
                  ) : (
                    <FaCheckCircle aria-hidden="true" style={{ color: '#059669', fontSize: '1.2rem' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                      {analysisResult.damage_detected ? 'AI ghi nhận khả năng có hư hỏng mới' : 'AI không ghi nhận hư hỏng mới rõ rệt'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      Mức độ: <StatusBadge status={severityToBadge(severity)} customLabel={severityLabel} />
                    </div>
                  </div>
                </div>
              </div>

              {(beforePreview || afterPreview) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Ảnh đã gửi phân tích</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {beforePreview && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 4 }}>Trước thuê</div>
                        <img src={beforePreview} alt="Trước thuê" style={{ width: '100%', borderRadius: 10, border: '1px solid #e5e7eb', maxHeight: 220, objectFit: 'cover' }} />
                      </div>
                    )}
                    {afterPreview && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 4 }}>Khi trả</div>
                        <img src={afterPreview} alt="Khi trả" style={{ width: '100%', borderRadius: 10, border: '1px solid #e5e7eb', maxHeight: 220, objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analysisResult.summary && (
                <div style={{ marginBottom: 14, fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>
                  <b>Tóm tắt:</b> {analysisResult.summary}
                </div>
              )}

              {differences.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Khác biệt / vị trí cần lưu ý</div>
                  {differences.map((d, i) => (
                    <div
                      key={`${d.area || ''}-${i}`}
                      style={{
                        background: d.likely_new_damage ? '#fffbeb' : '#f9fafb',
                        border: `1px solid ${d.likely_new_damage ? '#fde68a' : '#e5e7eb'}`,
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 8,
                        fontSize: '0.82rem',
                        color: '#374151',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.area || `Mục ${i + 1}`}</div>
                      <div>{d.description}</div>
                      {d.likely_new_damage && (
                        <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                          <FaExclamationTriangle aria-hidden="true" style={{ marginRight: 4 }} />
                          Có thể là hư hỏng phát sinh trong thời gian thuê
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {analysisResult.conclusion && (
                <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 10, fontSize: '0.85rem', color: '#334155' }}>
                  <b>Kết luận:</b> {analysisResult.conclusion}
                </div>
              )}

              {analysisResult.disclaimer && (
                <div style={{ marginBottom: 16, fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.45 }}>
                  {analysisResult.disclaimer}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={resetFlow}>
                  Kiểm tra mới
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (window.confirm('Xác nhận tạo báo cáo và gửi cho khách hàng?')) {
                      // submit report
                    }
                  }}
                >
                  Tạo báo cáo &amp; Gửi khách
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0' }}>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Xe</th>
                <th>Khách thuê</th>
                <th>Ngày kiểm tra</th>
                <th>Hư hỏng</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {INSPECTION_HISTORY.map((h) => (
                <tr key={h.id}>
                  <td>
                    <span className="code-badge">{h.booking}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{h.vehicle}</td>
                  <td>{h.renter}</td>
                  <td>{h.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    {h.damages > 0 ? (
                      <span className="tabular-nums" style={{ fontWeight: 700, color: '#dc2626' }}>
                        {h.damages} vết
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>0</span>
                    )}
                  </td>
                  <td>
                    {h.status === 'clean' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                        <FaCheckCircle aria-hidden="true" /> Không hư hỏng
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                        <FaExclamationTriangle aria-hidden="true" /> Phát hiện hư hỏng
                      </span>
                    )}
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
