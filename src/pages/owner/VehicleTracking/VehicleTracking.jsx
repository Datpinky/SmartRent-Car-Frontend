import React from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import { FaCalendarAlt, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { MOCK_OWNER_VEHICLES } from '../../../components/data/mockDashboard';

const VEHICLE_TIMELINE = {
  1: [
    { date: '11/03/2026', event: 'Xe đang cho thuê – Khách: Nguyễn Văn An', type: 'active', end: '13/03/2026' },
    { date: '09/03/2026', event: 'Xe được trả – Kiểm tra AI: Không có hư hỏng', type: 'completed' },
    { date: '07/03/2026', event: 'Cho thuê – Khách: Trần Thị Mai', type: 'completed', end: '09/03/2026' },
  ],
  2: [
    { date: '10/03/2026', event: 'Xe sẵn sàng tại showroom Auto Center Q1', type: 'available' },
    { date: '06/03/2026', event: 'Xe được trả – Kiểm tra AI: 1 vết xước nhẹ', type: 'warning' },
  ],
  3: [
    { date: '08/03/2026', event: 'Bảo dưỡng định kỳ – Dự kiến xong 15/03', type: 'maintenance' },
  ],
};

const TYPE_COLORS = { active: '#2563eb', completed: '#059669', available: '#00b14f', warning: '#d97706', maintenance: '#7c3aed' };

const VehicleTracking = () => {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Theo dõi xe</h1>
          <p className="page-subtitle">Trạng thái thực tế và lịch sử hoạt động từng xe</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {MOCK_OWNER_VEHICLES.map(v => (
          <div key={v.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdDirectionsCar style={{ fontSize: '1.6rem', color: '#0891b2' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{v.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>BKS: {v.plate} · {v.showroom}</div>
              </div>
              <StatusBadge status={v.status} />
            </div>

            {/* Current status */}
            {v.status === 'active' && (
              <div style={{ padding: '12px 20px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#2563eb', fontWeight: 600 }}>
                  <FaUser /> Đang thuê: Nguyễn Văn An
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#374151' }}>
                  <FaCalendarAlt size={12} /> Trả xe: 13/03/2026 10:00
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#374151' }}>
                  <FaMapMarkerAlt size={12} /> TP.HCM
                </span>
              </div>
            )}
            {v.status === 'maintenance' && (
              <div style={{ padding: '12px 20px', background: '#faf5ff', borderBottom: '1px solid #e9d5ff', fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>
                🔧 Đang bảo dưỡng – Dự kiến hoàn tất: 15/03/2026
              </div>
            )}

            {/* Timeline */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>Lịch sử hoạt động</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(VEHICLE_TIMELINE[v.id] || []).map((event, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[event.type] || '#9ca3af', marginTop: 3, flexShrink: 0 }} />
                      {i < (VEHICLE_TIMELINE[v.id] || []).length - 1 && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>{event.event}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{event.date}{event.end ? ` → ${event.end}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleTracking;
