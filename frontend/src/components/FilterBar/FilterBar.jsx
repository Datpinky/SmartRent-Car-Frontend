import React, { useState, useRef, useEffect } from 'react';
import {
    MdDirectionsCar, MdPeople, MdBrush,
    MdSort, MdFilterList, MdClose
} from 'react-icons/md';
import { FaGasPump, FaCar } from 'react-icons/fa';
import './FilterBar.css';

/* ── Danh sách chip ── */
const FILTERS = [
    { id: 'all', label: 'Tất cả', icon: <MdFilterList /> },
    { id: 'type', label: 'Hình thức thuê', icon: <MdDirectionsCar />, hasPopup: true },
    { id: 'seats', label: 'Số chỗ', icon: <MdPeople />, hasPopup: true },
    { id: 'brand', label: 'Hãng xe', icon: <FaCar />, hasPopup: true },
    { id: 'model', label: 'Mẫu xe', icon: <MdBrush />, hasPopup: true },
    { id: 'category', label: 'Loại xe', icon: <MdDirectionsCar />, hasPopup: true },
    { id: 'fuel', label: 'Nhiên liệu', icon: <FaGasPump />, hasPopup: true },
];

/* ── Tuỳ chọn bên trong mỗi popup ── */
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
    type: 'Hình thức thuê',
    seats: 'Số chỗ',
    brand: 'Hãng xe',
    model: 'Mẫu xe',
    category: 'Loại xe',
    fuel: 'Nhiên liệu',
    sort: 'Sắp xếp',
};

const FilterBar = ({ onFilter, onSort }) => {
    const [active, setActive] = useState('all');
    const [openPopup, setOpenPopup] = useState(null);

    // Lưu lựa chọn tạm (trong popup) & lựa chọn đã áp dụng
    const [selections, setSelections] = useState({
        type: 'all', seats: 'all', brand: 'all', model: 'all',
        category: 'all', fuel: 'all', sort: 'all',
    });
    const [tempSelection, setTempSelection] = useState('all');

    const popupRef = useRef(null);

    /* Đóng popup khi click bên ngoài */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setOpenPopup(null);
            }
        };
        if (openPopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openPopup]);

    /* Bấm chip */
    const handleChipClick = (f) => {
        if (f.hasPopup) {
            if (openPopup === f.id) {
                setOpenPopup(null);
            } else {
                setOpenPopup(f.id);
                setTempSelection(selections[f.id]);
            }
        } else if (f.id === 'all') {
            // Reset tất cả filter
            const resetSelections = {
                type: 'all', seats: 'all', brand: 'all', model: 'all',
                category: 'all', fuel: 'all', sort: 'all',
            };
            setSelections(resetSelections);
            setActive('all');
            setOpenPopup(null);
            if (onFilter) onFilter('all');
        } else {
            setActive(f.id);
            setOpenPopup(null);
            if (onFilter) onFilter(f.id);
        }
    };

    /* Áp dụng */
    const handleApply = () => {
        const newSelections = { ...selections, [openPopup]: tempSelection };
        setSelections(newSelections);
        setActive(openPopup);
        setOpenPopup(null);
        if (openPopup === 'sort') {
            if (onSort) onSort(tempSelection);
        } else {
            if (onFilter) onFilter(newSelections);
        }
    };

    /* Kiểm tra xem có filter nào đang active không */
    const hasAnyFilter = Object.values(selections).some(v => v !== 'all');

    /* Kiểm tra chip có đang được chọn (khác "all") */
    const isChipSelected = (id) => {
        if (id === 'all') return !hasAnyFilter && active === 'all';
        if (POPUP_OPTIONS[id]) return selections[id] !== 'all';
        return active === id;
    };

    return (
        <div className="filter-bar">
            <div className="filter-bar-inner">
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        className={`filter-chip ${isChipSelected(f.id) ? 'active' : ''}`}
                        onClick={() => handleChipClick(f)}
                    >
                        {f.icon}
                        {f.label}
                    </button>
                ))}
                <div className="filter-divider" />
                <button
                    className={`sort-chip ${selections.sort !== 'all' ? 'active' : ''}`}
                    onClick={() => {
                        if (openPopup === 'sort') {
                            setOpenPopup(null);
                        } else {
                            setOpenPopup('sort');
                            setTempSelection(selections.sort);
                        }
                    }}
                >
                    <MdSort />
                    Sắp xếp
                </button>
            </div>

            {/* ── Overlay + Popup ── */}
            {openPopup && POPUP_OPTIONS[openPopup] && (
                <>
                    <div className="filter-popup-overlay" onClick={() => setOpenPopup(null)} />
                    <div className="filter-popup" ref={popupRef}>
                        <div className="filter-popup-header">
                            <h3>{POPUP_TITLES[openPopup]}</h3>
                            <button className="filter-popup-close" onClick={() => setOpenPopup(null)}>
                                <MdClose size={20} />
                            </button>
                        </div>
                        <div className="filter-popup-body">
                            {POPUP_OPTIONS[openPopup].map(opt => (
                                <label className="filter-popup-option" key={opt.value} onClick={() => setTempSelection(opt.value)}>
                                    <span className={`filter-radio ${tempSelection === opt.value ? 'checked' : ''}`}>
                                        {tempSelection === opt.value && <span className="filter-radio-dot" />}
                                    </span>
                                    <span className="filter-option-label">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                        <button className="filter-popup-apply" onClick={handleApply}>
                            Áp dụng
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FilterBar;
