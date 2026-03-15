import React, { useState, useRef, useEffect } from 'react';
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

const FilterBar = ({ onFilter, onSort }) => {
  const [active, setActive] = useState('all');
  const [openPopup, setOpenPopup] = useState(null);
  const [selections, setSelections] = useState({
    type: 'all', seats: 'all', brand: 'all', model: 'all',
    category: 'all', fuel: 'all', sort: 'all',
  });
  const [tempSelection, setTempSelection] = useState('all');
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpenPopup(null);
    };
    if (openPopup) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopup]);

  const handleChipClick = (f) => {
    if (f.hasPopup) {
      if (openPopup === f.id) { setOpenPopup(null); }
      else { setOpenPopup(f.id); setTempSelection(selections[f.id]); }
    } else if (f.id === 'all') {
      const reset = { type: 'all', seats: 'all', brand: 'all', model: 'all', category: 'all', fuel: 'all', sort: 'all' };
      setSelections(reset); setActive('all'); setOpenPopup(null);
      if (onFilter) onFilter('all');
    } else {
      setActive(f.id); setOpenPopup(null);
      if (onFilter) onFilter(f.id);
    }
  };

  const handleApply = () => {
    const newSelections = { ...selections, [openPopup]: tempSelection };
    setSelections(newSelections); setActive(openPopup); setOpenPopup(null);
    if (openPopup === 'sort') { if (onSort) onSort(tempSelection); }
    else { if (onFilter) onFilter(newSelections); }
  };

  const hasAnyFilter = Object.values(selections).some(v => v !== 'all');
  const isChipSelected = (id) => {
    if (id === 'all') return !hasAnyFilter && active === 'all';
    if (POPUP_OPTIONS[id]) return selections[id] !== 'all';
    return active === id;
  };

  const chipBase = "flex items-center gap-1.5 px-4 py-2 rounded-full border text-[0.82rem] font-medium cursor-pointer transition-all whitespace-nowrap";
  const chipActive = "bg-primary text-white border-primary shadow-sm";
  const chipDefault = "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary";

  return (
    <div className="relative bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] z-[50]">
      <div className="max-w-[1280px] mx-auto px-5 py-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`${chipBase} ${isChipSelected(f.id) ? chipActive : chipDefault}`}
            onClick={() => handleChipClick(f)}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />
        <button
          className={`${chipBase} ${selections.sort !== 'all' ? chipActive : chipDefault}`}
          onClick={() => {
            if (openPopup === 'sort') setOpenPopup(null);
            else { setOpenPopup('sort'); setTempSelection(selections.sort); }
          }}
        >
          <MdSort />
          Sắp xếp
        </button>
      </div>

      {openPopup && POPUP_OPTIONS[openPopup] && (
        <>
          <div className="fixed inset-0 z-[49]" onClick={() => setOpenPopup(null)} />
          <div
            ref={popupRef}
            className="absolute left-5 top-[calc(100%+8px)] z-[51] bg-white border border-gray-200 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] min-w-[220px] overflow-hidden animate-[slideDown_0.15s_ease]"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <h3 className="text-[0.9rem] font-bold text-gray-900">{POPUP_TITLES[openPopup]}</h3>
              <button className="text-gray-400 hover:text-gray-700 transition-colors" onClick={() => setOpenPopup(null)}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="py-2 max-h-[280px] overflow-y-auto">
              {POPUP_OPTIONS[openPopup].map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setTempSelection(opt.value)}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${tempSelection === opt.value ? 'border-primary' : 'border-gray-300'}`}>
                    {tempSelection === opt.value && <span className="w-2 h-2 rounded-full bg-primary block" />}
                  </span>
                  <span className={`text-[0.88rem] ${tempSelection === opt.value ? 'text-primary font-semibold' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl text-[0.88rem] transition-colors hover:bg-primary-dark"
                onClick={handleApply}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterBar;
