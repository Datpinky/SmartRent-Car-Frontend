import React, { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import FileUpload from '../../../components/common/FileUpload';
import { FaPlus, FaEdit } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { MOCK_OWNER_VEHICLES } from '../../../components/data/mockDashboard';

const MyVehicles = () => {
  const [vehicles, setVehicles] = useState(MOCK_OWNER_VEHICLES.map(v => ({ ...v, rating: 4.7, consignDate: '01/01/2026' })));
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', plate: '', brand: '', category: 'SUV', price: '', seats: 5, fuel: 'Xăng' });

  const handleAdd = () => {
    setVehicles(prev => [...prev, { ...form, id: Date.now(), showroom: 'Chưa phân bổ', status: 'pending', trips: 0, revenue: 0, pendingRevenue: 0, rating: 0, consignDate: new Date().toLocaleDateString('vi-VN') }]);
    setAddModal(false);
    setForm({ name: '', plate: '', brand: '', category: 'SUV', price: '', seats: 5, fuel: 'Xăng' });
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Xe của tôi</h1>
          <p className="page-subtitle">Quản lý và theo dõi các xe đang ký gửi</p>
        </div>
        <button className="btn-primary" onClick={() => setAddModal(true)}><FaPlus /> Đăng ký ký gửi xe mới</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, alignItems: 'stretch' }}>
        {vehicles.map(v => (
          <div key={v.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdDirectionsCar style={{ fontSize: '1.8rem', color: '#0891b2' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{v.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>BKS: {v.plate}</div>
                <div style={{ marginTop: 6 }}><StatusBadge status={v.status} /></div>
              </div>
              <button className="btn-icon" style={{ flexShrink: 0 }} title="Chỉnh sửa"><FaEdit /></button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                ['Showroom', v.showroom || 'Chưa phân bổ'],
                ['Giá thuê', v.price ? v.price + 'K/ngày' : '—'],
                ['Số chuyến', v.trips],
                ['Đánh giá', v.rating > 0 ? `★ ${v.rating}` : '—'],
              ].map(([k, val]) => (
                <div key={k} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px', minHeight: k === 'Showroom' ? 48 : undefined }}>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', marginTop: 2, ...(k === 'Showroom' ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}) }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Tổng doanh thu</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#00b14f' }}>{(v.revenue / 1000000).toFixed(1)}M VND</div>
              </div>
              {v.pendingRevenue > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Chờ nhận</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#d97706' }}>{(v.pendingRevenue / 1000).toLocaleString()}K</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Đăng ký ký gửi xe mới" width={560}
        footer={<><button className="btn-outline" onClick={() => setAddModal(false)}>Hủy</button><button className="btn-primary" onClick={handleAdd}>Gửi đăng ký</button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: '0.8rem', color: '#92400e' }}>
            Sau khi đăng ký, nhân viên SmartRent sẽ liên hệ để kiểm tra xe và ký hợp đồng ký gửi.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Tên xe', 'name'], ['Biển số (BKS)', 'plate'], ['Thương hiệu', 'brand'], ['Số chỗ', 'seats']].map(([label, key]) => (
              <div key={key}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại xe</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {['Sedan','SUV','MPV','Hatchback','Bán tải'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nhiên liệu</label>
              <select value={form.fuel} onChange={e => setForm(f => ({ ...f, fuel: e.target.value }))} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {['Xăng','Dầu','Điện','Hybrid'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <FileUpload label="Ảnh xe" multiple hint="Ảnh chụp toàn cảnh xe (4 góc + nội thất)" />
        </div>
      </Modal>
    </div>
  );
};

export default MyVehicles;
