import React, { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import FileUpload from '../../../components/common/FileUpload';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRoute } from 'react-icons/fa';
import { MdDirectionsCar, MdLocalGasStation, MdEventSeat } from 'react-icons/md';
import { MOCK_SHOWROOM_VEHICLES } from '../../../components/data/mockDashboard';
import '../../admin/AdminDashboard/AdminDashboard.css';

const STATUS_OPTS = ['available', 'active', 'maintenance'];
const FUEL_OPTS = ['Xăng', 'Dầu', 'Điện', 'Hybrid'];
const CAT_OPTS = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Bán tải'];

const initForm = { name: '', plate: '', brand: '', category: 'SUV', price: '', seats: 5, fuel: 'Xăng', transmission: 'Số tự động', source: 'showroom', status: 'available', consignOwner: '' };

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState(MOCK_SHOWROOM_VEHICLES);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(initForm);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  const openAdd  = () => { setForm(initForm); setEditId(null); setModal('form'); };
  const openEdit = (v) => { setForm({ ...v }); setEditId(v.id); setModal('form'); };
  const closeModal = () => { setModal(null); setForm(initForm); setEditId(null); };

  const handleSave = () => {
    if (editId) setVehicles(prev => prev.map(v => v.id === editId ? { ...v, ...form } : v));
    else setVehicles(prev => [...prev, { ...form, id: Date.now(), trips: 0, rating: 0 }]);
    closeModal();
  };

  const handleDelete = (id) => { if (window.confirm('Xác nhận xóa xe này?')) setVehicles(prev => prev.filter(v => v.id !== id)); };

  const filtered = vehicles.filter(v => {
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchSource = filterSource === 'all' || v.source === filterSource;
    return matchStatus && matchSource;
  });

  const columns = [
    { key: 'name', label: 'Thông tin xe', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MdDirectionsCar size={22} color="#00b14f" />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#111827' }}>{row.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>BKS: {row.plate}</div>
        </div>
      </div>
    )},
    { key: 'category', label: 'Phân loại', render: row => (
      <div style={{ fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 600, color: '#374151' }}>{row.category}</div>
        <div style={{ color: '#9ca3af', display: 'flex', gap: 6, marginTop: 2 }}>
          <span><MdEventSeat size={12} /> {row.seats}</span>
          <span><MdLocalGasStation size={12} /> {row.fuel}</span>
        </div>
      </div>
    )},
    { key: 'price', label: 'Giá/ngày', render: row => <span style={{ fontWeight: 700, color: '#00b14f', fontSize: '0.9rem' }}>{row.price}K</span>, sortable: true, accessor: 'price' },
    { key: 'trips', label: 'Chuyến', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <FaRoute size={12} color="#9ca3af" /><span style={{ fontWeight: 600 }}>{row.trips}</span>
      </div>
    ), sortable: true, accessor: 'trips', align: 'center' },
    { key: 'rating', label: 'Đánh giá', render: row => row.rating > 0 ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: '#d97706' }}>
        <FaStar size={12} /> {row.rating}
      </span>
    ) : <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>—</span> },
    { key: 'source', label: 'Nguồn', render: row => (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 50,
        background: row.source === 'showroom' ? '#dbeafe' : '#e0e7ff',
        color: row.source === 'showroom' ? '#2563eb' : '#4338ca' }}>
        {row.source === 'showroom' ? 'Showroom' : 'Ký gửi'}
      </span>
    )},
    { key: 'status', label: 'Trạng thái', render: row => <StatusBadge status={row.status} /> },
    { key: 'actions', label: '', render: row => (
      <div style={{ display: 'flex', gap: 5 }}>
        <button className="btn-icon" onClick={() => openEdit(row)} title="Chỉnh sửa"><FaEdit /></button>
        <button className="btn-icon danger" onClick={() => handleDelete(row.id)} title="Xóa xe"><FaTrash /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Quản lý xe</h1>
          <p className="page-subtitle">Quản lý toàn bộ xe trong showroom ({vehicles.length} xe)</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus /> Thêm xe mới</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', marginRight: 4 }}>Trạng thái:</span>
          {['all', 'available', 'active', 'maintenance'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '4px 12px', borderRadius: 50, border: '1.5px solid', borderColor: filterStatus === s ? '#00b14f' : '#e5e7eb', background: filterStatus === s ? '#00b14f' : '#fff', color: filterStatus === s ? '#fff' : '#374151', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              {s === 'all' ? 'Tất cả' : s === 'available' ? 'Sẵn sàng' : s === 'active' ? 'Đang thuê' : 'Bảo dưỡng'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', marginRight: 4 }}>Nguồn:</span>
          {['all', 'showroom', 'consigned'].map(s => (
            <button key={s} onClick={() => setFilterSource(s)} style={{ padding: '4px 12px', borderRadius: 50, border: '1.5px solid', borderColor: filterSource === s ? '#4338ca' : '#e5e7eb', background: filterSource === s ? '#4338ca' : '#fff', color: filterSource === s ? '#fff' : '#374151', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              {s === 'all' ? 'Tất cả' : s === 'showroom' ? 'Showroom' : 'Ký gửi'}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} searchPlaceholder="Tìm theo tên xe, biển số..." />

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === 'form'} onClose={closeModal} title={editId ? 'Chỉnh sửa xe' : 'Thêm xe mới'} width={580}
        footer={<><button className="btn-outline" onClick={closeModal}>Hủy</button><button className="btn-primary" onClick={handleSave}>Lưu xe</button></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            ['Tên xe', 'name', 'text'], ['Biển số', 'plate', 'text'],
            ['Thương hiệu', 'brand', 'text'], ['Số chỗ ngồi', 'seats', 'number'],
            ['Giá thuê/ngày (K)', 'price', 'number'],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          {[
            ['Phân loại', 'category', CAT_OPTS],
            ['Nhiên liệu', 'fuel', FUEL_OPTS],
            ['Hộp số', 'transmission', ['Số tự động', 'Số sàn']],
            ['Nguồn xe', 'source', ['showroom', 'consigned']],
            ['Trạng thái', 'status', STATUS_OPTS],
          ].map(([label, key, opts]) => (
            <div key={key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
              <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        {form.source === 'consigned' && (
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tên chủ xe ký gửi</label>
            <input value={form.consignOwner} onChange={e => setForm(f => ({ ...f, consignOwner: e.target.value }))}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <FileUpload label="Hình ảnh xe" multiple hint="JPG, PNG – tối đa 5MB mỗi ảnh" />
        </div>
      </Modal>
    </div>
  );
};

export default VehicleManagement;
