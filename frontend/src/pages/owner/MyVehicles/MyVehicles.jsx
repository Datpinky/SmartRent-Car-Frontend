import React, { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import FileUpload from '../../../components/common/FileUpload';
import { FaPlus, FaEdit, FaSave, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { MOCK_OWNER_VEHICLES } from '../../../components/data/mockDashboard';

/* ─── trường chỉnh sửa xe ─── */
const EDIT_FIELDS = [
  { key: 'name',     label: 'Tên xe',        placeholder: 'Honda CR-V L 2023',     half: false },
  { key: 'plate',    label: 'Biển số (BKS)', placeholder: '51H-23456',             half: true  },
  { key: 'brand',    label: 'Thương hiệu',   placeholder: 'Honda',                 half: true  },
  { key: 'seats',    label: 'Số chỗ ngồi',   placeholder: '5',                     half: true, type: 'number' },
  { key: 'price',    label: 'Giá thuê (K/ngày)', placeholder: '1100',              half: true, type: 'number' },
];

const defaultEditForm = (v) => ({
  name:        v.name        || '',
  plate:       v.plate       || '',
  brand:       v.brand       || '',
  category:    v.category    || 'SUV',
  seats:       v.seats       != null ? String(v.seats) : '5',
  fuel:        v.fuel        || 'Xăng',
  price:       v.price       != null ? String(v.price) : '',
  description: v.description || '',
});

const MyVehicles = () => {
  const [vehicles, setVehicles] = useState(
    MOCK_OWNER_VEHICLES.map(v => ({ ...v, brand: v.brand || '', category: v.category || 'SUV', seats: v.seats || 5, fuel: v.fuel || 'Xăng', description: v.description || '', rating: 4.7, consignDate: '01/01/2026' }))
  );

  /* ── Thêm xe mới ── */
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', plate: '', brand: '', category: 'SUV', price: '', seats: 5, fuel: 'Xăng' });

  const handleAdd = () => {
    setVehicles(prev => [...prev, {
      ...addForm,
      id: Date.now(),
      showroom: 'Chưa phân bổ',
      status: 'pending',
      trips: 0, revenue: 0, pendingRevenue: 0,
      rating: 0,
      description: '',
      consignDate: new Date().toLocaleDateString('vi-VN'),
    }]);
    setAddModal(false);
    setAddForm({ name: '', plate: '', brand: '', category: 'SUV', price: '', seats: 5, fuel: 'Xăng' });
  };

  /* ── Chỉnh sửa xe ── */
  const [editTarget, setEditTarget]   = useState(null);   // xe đang sửa
  const [editForm, setEditForm]       = useState({});
  const [editErrors, setEditErrors]   = useState({});
  const [editSaved, setEditSaved]     = useState(false);

  const openEdit = (v) => {
    setEditTarget(v);
    setEditForm(defaultEditForm(v));
    setEditErrors({});
    setEditSaved(false);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditErrors({});
  };

  const handleEditChange = (key, value) => {
    setEditForm(f => ({ ...f, [key]: value }));
    setEditErrors(e => ({ ...e, [key]: '' }));
  };

  const validateEdit = () => {
    const errs = {};
    if (!editForm.name?.trim())  errs.name  = 'Tên xe không được để trống.';
    if (!editForm.plate?.trim()) errs.plate = 'Biển số không được để trống.';
    if (!editForm.brand?.trim()) errs.brand = 'Thương hiệu không được để trống.';
    const price = Number(editForm.price);
    if (!editForm.price || isNaN(price) || price <= 0) errs.price = 'Giá thuê phải là số dương.';
    const seats = Number(editForm.seats);
    if (!editForm.seats || isNaN(seats) || seats < 2 || seats > 16) errs.seats = 'Số chỗ ngồi hợp lệ từ 2 – 16.';
    return errs;
  };

  const handleEditSave = () => {
    const errs = validateEdit();
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }

    setVehicles(prev => prev.map(v =>
      v.id === editTarget.id
        ? { ...v, ...editForm, price: Number(editForm.price), seats: Number(editForm.seats) }
        : v
    ));
    setEditSaved(true);
    setTimeout(() => {
      setEditSaved(false);
      closeEdit();
    }, 1200);
  };

  /* ─────────────────────────────── UI ─────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Xe của tôi</h1>
          <p className="page-subtitle">Quản lý và theo dõi các xe đang ký gửi</p>
        </div>
        <button className="btn-primary" onClick={() => setAddModal(true)}>
          <FaPlus /> Đăng ký ký gửi xe mới
        </button>
      </div>

      {/* Danh sách xe */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, alignItems: 'stretch' }}>
        {vehicles.map(v => (
          <div key={v.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdDirectionsCar style={{ fontSize: '1.8rem', color: '#0891b2' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{v.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>BKS: {v.plate}</div>
                <div style={{ marginTop: 6 }}><StatusBadge status={v.status} /></div>
              </div>
              {/* ✏️ Nút chỉnh sửa */}
              <button
                className="btn-icon"
                style={{ flexShrink: 0 }}
                title="Chỉnh sửa thông tin xe"
                onClick={() => openEdit(v)}
              >
                <FaEdit />
              </button>
            </div>

            {/* Stats grid */}
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

            {/* Revenue */}
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

      {/* ═══════════════ MODAL THÊM XE MỚI ═══════════════ */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Đăng ký ký gửi xe mới"
        width={560}
        footer={
          <>
            <button className="btn-outline" onClick={() => setAddModal(false)}>Hủy</button>
            <button className="btn-primary" onClick={handleAdd}>Gửi đăng ký</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: '0.8rem', color: '#92400e' }}>
            Sau khi đăng ký, nhân viên SmartRent sẽ liên hệ để kiểm tra xe và ký hợp đồng ký gửi.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Tên xe', 'name'], ['Biển số (BKS)', 'plate'], ['Thương hiệu', 'brand'], ['Số chỗ', 'seats']].map(([label, key]) => (
              <div key={key}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                <input value={addForm[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại xe</label>
              <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {['Sedan', 'SUV', 'MPV', 'Hatchback', 'Bán tải'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nhiên liệu</label>
              <select value={addForm.fuel} onChange={e => setAddForm(f => ({ ...f, fuel: e.target.value }))} style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {['Xăng', 'Dầu', 'Điện', 'Hybrid'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <FileUpload label="Ảnh xe" multiple hint="Ảnh chụp toàn cảnh xe (4 góc + nội thất)" />
        </div>
      </Modal>

      {/* ═══════════════ MODAL CHỈNH SỬA XE ═══════════════ */}
      <Modal
        isOpen={!!editTarget}
        onClose={closeEdit}
        title={`Chỉnh sửa: ${editTarget?.name || ''}`}
        width={600}
        footer={
          editSaved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>
              <FaCheckCircle /> Đã lưu thay đổi!
            </div>
          ) : (
            <>
              <button className="btn-outline" onClick={closeEdit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaTimes /> Hủy
              </button>
              <button className="btn-primary" onClick={handleEditSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaSave /> Lưu thay đổi
              </button>
            </>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Thông tin cơ bản */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Thông tin cơ bản
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Tên xe – full width */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Tên xe <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  value={editForm.name || ''}
                  onChange={e => handleEditChange('name', e.target.value)}
                  placeholder="Honda CR-V L 2023"
                  style={inputStyle(editErrors.name)}
                />
                {editErrors.name && <div style={errStyle}>{editErrors.name}</div>}
              </div>

              {/* Biển số */}
              <div>
                <label style={labelStyle}>Biển số (BKS) <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  value={editForm.plate || ''}
                  onChange={e => handleEditChange('plate', e.target.value)}
                  placeholder="51H-23456"
                  style={inputStyle(editErrors.plate)}
                />
                {editErrors.plate && <div style={errStyle}>{editErrors.plate}</div>}
              </div>

              {/* Thương hiệu */}
              <div>
                <label style={labelStyle}>Thương hiệu <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  value={editForm.brand || ''}
                  onChange={e => handleEditChange('brand', e.target.value)}
                  placeholder="Honda"
                  style={inputStyle(editErrors.brand)}
                />
                {editErrors.brand && <div style={errStyle}>{editErrors.brand}</div>}
              </div>

              {/* Loại xe */}
              <div>
                <label style={labelStyle}>Loại xe</label>
                <select value={editForm.category || 'SUV'} onChange={e => handleEditChange('category', e.target.value)} style={selectStyle}>
                  {['Sedan', 'SUV', 'MPV', 'Hatchback', 'Bán tải'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Nhiên liệu */}
              <div>
                <label style={labelStyle}>Nhiên liệu</label>
                <select value={editForm.fuel || 'Xăng'} onChange={e => handleEditChange('fuel', e.target.value)} style={selectStyle}>
                  {['Xăng', 'Dầu', 'Điện', 'Hybrid'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Số chỗ */}
              <div>
                <label style={labelStyle}>Số chỗ ngồi <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="number"
                  min={2} max={16}
                  value={editForm.seats || ''}
                  onChange={e => handleEditChange('seats', e.target.value)}
                  placeholder="5"
                  style={inputStyle(editErrors.seats)}
                />
                {editErrors.seats && <div style={errStyle}>{editErrors.seats}</div>}
              </div>

              {/* Giá thuê */}
              <div>
                <label style={labelStyle}>Giá thuê (K/ngày) <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="number"
                  min={1}
                  value={editForm.price || ''}
                  onChange={e => handleEditChange('price', e.target.value)}
                  placeholder="1100"
                  style={inputStyle(editErrors.price)}
                />
                {editErrors.price && <div style={errStyle}>{editErrors.price}</div>}
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label style={labelStyle}>Mô tả xe</label>
            <textarea
              value={editForm.description || ''}
              onChange={e => handleEditChange('description', e.target.value)}
              placeholder="Thêm mô tả về tình trạng, tiện nghi, ghi chú đặc biệt của xe..."
              rows={3}
              style={{ ...inputStyle(false), resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Hiện trạng (read-only info) */}
          <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 10, padding: '12px 14px', fontSize: '0.8rem', color: '#4338ca' }}>
            <strong>Lưu ý:</strong> Trạng thái xe và showroom được quản lý bởi SmartRent và không thể thay đổi trực tiếp. Liên hệ bộ phận hỗ trợ nếu cần cập nhật.
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ─── style helpers ─── */
const labelStyle = {
  fontSize: '0.8rem', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: 4,
};

const inputStyle = (hasErr) => ({
  width: '100%',
  border: `1.5px solid ${hasErr ? '#dc2626' : '#e5e7eb'}`,
  borderRadius: 9,
  padding: '8px 12px',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  background: hasErr ? '#fff5f5' : '#fff',
  transition: 'border-color 0.2s',
});

const selectStyle = {
  width: '100%',
  border: '1.5px solid #e5e7eb',
  borderRadius: 9,
  padding: '8px 12px',
  fontSize: '0.85rem',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
};

const errStyle = {
  color: '#dc2626', fontSize: '0.75rem', marginTop: 4,
};

export default MyVehicles;
