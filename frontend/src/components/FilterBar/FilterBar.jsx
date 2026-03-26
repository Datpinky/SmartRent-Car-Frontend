import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MdDirectionsCar, MdPeople, MdBrush, MdSort, MdFilterList, MdClose } from 'react-icons/md';
import { FaGasPump, FaCar } from 'react-icons/fa';

const FILTERS = [
  { id: 'all', label: 'Tất cả', icon: <MdFilterList /> },
  { id: 'type', label: 'Hình thức thuê', icon: <MdDirectionsCar />, hasPopup: true },
  { id: 'seats', label: 'Số chỗ', icon: <MdPeople />, hasPopup: true },
  { id: 'brand', label: 'Hãng xe', icon: <FaCar />, hasPopup: true },
  { id: 'model', label: 'Mẫu xe', icon: <MdBrush />, hasPopup: true },
  { id: 'category', label: 'Loại xe', icon: <MdDirectionsCar />, hasPopup: true },
  { id: 'fuel', label: 'Nhiên liệu', icon: <FaGasPump />, hasPopup: true },
];

const POPUP_OPTIONS = {
  type: [
    { value: 'all', label: 'Tất cả hình thức' },
    { value: 'Gặp chủ xe', label: 'Gặp chủ xe' },
    { value: 'Tự nhận xe', label: 'Tự nhận xe' },
  ],
  seats: [
    { value: 'all', label: 'Tất cả' },
    { value: '4', label: '4 chỗ' },
    { value: '5', label: '5 chỗ' },
    { value: '7', label: '7 chỗ' },
  ],
  brand: [
    { value: 'all', label: 'Tất cả' },
    { value: 'Toyota', label: 'Toyota' },
    { value: 'Honda', label: 'Honda' },
    { value: 'Hyundai', label: 'Hyundai' },
    { value: 'Kia', label: 'Kia' },
    { value: 'Mazda', label: 'Mazda' },
    { value: 'VinFast', label: 'VinFast' },
    { value: 'Ford', label: 'Ford' },
    { value: 'MG', label: 'MG' },
  ],
  model: [
    { value: 'all', label: 'Tất cả' },
    { value: 'Số tự động', label: 'Số tự động' },
    { value: 'Số sàn', label: 'Số sàn' },
  ],
  category: [
    { value: 'all', label: 'Tất cả' },
    { value: 'Sedan', label: 'Sedan' },
    { value: 'Hatchback', label: 'Hatchback' },
    { value: 'SUV', label: 'SUV' },
    { value: 'Crossover', label: 'Crossover (CUV)' },
    { value: 'MPV', label: 'MPV (xe 7 chỗ gia đình)' },
    { value: 'Coupe', label: 'Coupe' },
    { value: 'Convertible', label: 'Convertible (mui trần)' },
    { value: 'Limousine', label: 'Limousine' },
  ],
  fuel: [
    { value: 'all', label: 'Tất cả' },
    { value: 'Xăng', label: 'Xăng' },
    { value: 'Điện', label: 'Điện' },
    { value: 'Dầu', label: 'Dầu' },
  ],
  sort: [
    { value: 'all', label: 'Mặc định' },
    { value: 'price_asc', label: 'Giá từ thấp tới cao' },
    { value: 'price_desc', label: 'Giá từ cao tới thấp' },
  ],
};

const POPUP_TITLES = {
  type: 'Hình thức thuê', seats: 'Số chỗ', brand: 'Hãng xe',
  model: 'Mẫu xe', category: 'Loại xe', fuel: 'Nhiên liệu', sort: 'Sắp xếp',
};

/* ─── Popup component độc lập ─── */
const FilterPopup = ({ id, anchorRef, options, title, tempSelection, onSelect, onApply, onClose }) => {
  const popupRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  /* Tính vị trí popup bên dưới nút anchor */
  useEffect(() => {
    if (!anchorRef?.current || !popupRef.current) return;

    const btn = anchorRef.current.getBoundingClientRect();
    const popup = popupRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    let left = btn.left;
    let top = btn.bottom + 8; // 8px gap bên dưới nút

    // Không để tràn ra bên phải màn hình
    if (left + popup.width > vw - 16) {
      left = vw - popup.width - 16;
    }
    if (left < 8) left = 8;

    setPos({ top, left });
  }, [anchorRef, id]);

  return (
    <>
      {/* Overlay trong suốt để bắt click ra ngoài */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        onMouseDown={onClose}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 999,
          width: 240,
          background: '#fff',
          border: '1.5px solid #e5e7eb',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
          overflow: 'hidden',
          animation: 'slideDown 0.15s ease',
        }}
        onMouseDown={e => e.stopPropagation()} // không đóng khi click bên trong
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px 12px', borderBottom: '1px solid #f3f4f6',
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Options */}
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                cursor: 'pointer',
                background: tempSelection === opt.value ? '#f0fdf4' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (tempSelection !== opt.value) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = tempSelection === opt.value ? '#f0fdf4' : 'transparent'; }}
            >
              {/* Radio dot */}
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${tempSelection === opt.value ? '#059669' : '#d1d5db'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.15s',
              }}>
                {tempSelection === opt.value && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'block' }} />
                )}
              </span>
              <span style={{
                fontSize: '0.87rem',
                fontWeight: tempSelection === opt.value ? 600 : 400,
                color: tempSelection === opt.value ? '#059669' : '#374151',
              }}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={onApply}
            style={{
              width: '100%', padding: '9px 0',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </>
  );
};

/* ─── FilterBar chính ─── */
const FilterBar = ({ onFilter, onSort }) => {
  const [active, setActive] = useState('all');
  const [openPopup, setOpenPopup] = useState(null);
  const [selections, setSelections] = useState({
    type: 'all', seats: 'all', brand: 'all',
    model: 'all', category: 'all', fuel: 'all', sort: 'all',
  });
  const [tempSelection, setTempSelection] = useState('all');

  // Lưu ref của từng nút chip để tính vị trí popup
  const btnRefs = useRef({});

  const openFilter = (id) => {
    if (openPopup === id) {
      setOpenPopup(null);
    } else {
      setTempSelection(selections[id] ?? 'all');
      setOpenPopup(id);
    }
  };

  const handleClose = () => setOpenPopup(null);

  const handleApply = () => {
    const newSelections = { ...selections, [openPopup]: tempSelection };
    setSelections(newSelections);
    setActive(openPopup);
    setOpenPopup(null);
    if (openPopup === 'sort') { if (onSort) onSort(tempSelection); }
    else { if (onFilter) onFilter(newSelections); }
  };

  const handleAllClick = () => {
    const reset = { type: 'all', seats: 'all', brand: 'all', model: 'all', category: 'all', fuel: 'all', sort: 'all' };
    setSelections(reset); setActive('all'); setOpenPopup(null);
    if (onFilter) onFilter('all');
  };

  const hasAnyFilter = Object.values(selections).some(v => v !== 'all');
  const isChipSelected = (id) => {
    if (id === 'all') return !hasAnyFilter && active === 'all';
    if (POPUP_OPTIONS[id]) return selections[id] !== 'all';
    return active === id;
  };

  const chipBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 99,
    fontSize: '0.82rem', fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
    border: '1.5px solid', transition: 'all 0.15s',
    fontFamily: 'inherit',
  };
  const chipActive = { background: '#059669', color: '#fff', borderColor: '#059669', boxShadow: '0 2px 6px rgba(5,150,105,0.2)' };
  const chipDefault = { background: '#fff', color: '#4b5563', borderColor: '#e5e7eb' };

  return (
    <div style={{ position: 'relative', background: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}
        className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* "Tất cả" chip */}
        <button
          style={{ ...chipBase, ...(isChipSelected('all') ? chipActive : chipDefault) }}
          onClick={handleAllClick}
        >
          <MdFilterList />
          Tất cả
        </button>

        {/* Filter chips */}
        {FILTERS.filter(f => f.id !== 'all').map(f => (
          <button
            key={f.id}
            ref={el => btnRefs.current[f.id] = el}
            style={{
              ...chipBase,
              ...(isChipSelected(f.id) ? chipActive : chipDefault),
              ...(openPopup === f.id && !isChipSelected(f.id)
                ? { borderColor: '#059669', color: '#059669', background: '#f0fdf4' }
                : {}),
            }}
            onClick={() => openFilter(f.id)}
          >
            {f.icon}
            {f.label}
            {/* Chevron nhỏ */}
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transform: openPopup === f.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.18s', marginLeft: 2 }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#e5e7eb', flexShrink: 0, margin: '0 4px' }} />

        {/* Sắp xếp */}
        <button
          ref={el => btnRefs.current['sort'] = el}
          style={{
            ...chipBase,
            ...(selections.sort !== 'all' ? chipActive : chipDefault),
            ...(openPopup === 'sort' && selections.sort === 'all'
              ? { borderColor: '#059669', color: '#059669', background: '#f0fdf4' }
              : {}),
          }}
          onClick={() => openFilter('sort')}
        >
          <MdSort />
          Sắp xếp
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: openPopup === 'sort' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.18s', marginLeft: 2 }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Popup dropdown */}
      {openPopup && POPUP_OPTIONS[openPopup] && (
        <FilterPopup
          id={openPopup}
          anchorRef={{ current: btnRefs.current[openPopup] }}
          options={POPUP_OPTIONS[openPopup]}
          title={POPUP_TITLES[openPopup]}
          tempSelection={tempSelection}
          onSelect={setTempSelection}
          onApply={handleApply}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default FilterBar;
