import React, { useState, useEffect } from 'react';
import {
    FaMapMarkerAlt, FaSearch, FaTimes, FaCheck, FaChevronRight, FaCar
} from 'react-icons/fa';
import './SearchBar.css';

/* ── Dữ liệu ── */
const CITIES = ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh'];

const CITY_DISTRICTS = {
    'Đà Nẵng': {
        'Quận': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'],
        'Huyện': ['Hòa Vang'],
    },
    'Hồ Chí Minh': {
        'Quận': ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7',
            'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh',
            'Gò Vấp', 'Tân Bình', 'Tân Phú', 'Phú Nhuận', 'Bình Tân'],
        'Huyện': ['Bình Chánh', 'Củ Chi', 'Hóc Môn', 'Nhà Bè', 'Cần Giờ'],
    },
    'Hà Nội': {
        'Quận': ['Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Cầu Giấy',
            'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Tây Hồ', 'Hà Đông'],
        'Huyện': ['Đông Anh', 'Gia Lâm', 'Sóc Sơn', 'Thanh Trì', 'Hoài Đức'],
    },
};



/* ══════════════════════════════════════════════════════ */
const SearchBar = ({ onSearch }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);   // bước 1
    const [selectedDist, setDist] = useState('');     // bước 2 – chỉ 1
    const [carName, setCarName] = useState('');     // ── THÊM TÊN XE ──

    /* khoá scroll */
    useEffect(() => {
        document.body.style.overflow = showModal ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showModal]);

    /* chọn thành phố → reset quận */
    const handleCityClick = (city) => {
        setSelectedCity(city);
        setDist('');
    };

    /* single-select quận/huyện */
    const handleDistClick = (d) => setDist(prev => prev === d ? '' : d);

    const handleSearch = () => {
        const location = selectedDist || selectedCity || '';
        if (onSearch) onSearch({ location, carName });
        setShowModal(false);
    };

    const districts = selectedCity ? CITY_DISTRICTS[selectedCity] : null;

    /* label hiển thị: "Thành phố - Quận/Huyện" hoặc chỉ tên TP */
    const locLabel = selectedCity && selectedDist
        ? `${selectedCity} - ${selectedDist}`
        : selectedCity || '';

    return (
        <>
            {/* ── Thanh search ngoài ── */}
            <section className="search-section">
                <h1 className="search-title">Tìm xe tự lái</h1>
                <div className="search-bar search-bar-slim" onClick={() => setShowModal(true)}>
                    <div className="search-field">
                        <FaMapMarkerAlt className="search-field-icon" />
                        <div className="search-field-content">
                            <span className="search-field-label">Địa điểm</span>
                            <span className={`search-field-value ${locLabel ? '' : 'placeholder'}`}>
                                {locLabel || 'Chọn địa điểm tìm xe'}
                            </span>
                        </div>
                    </div>

                    {/* ── Bổ sung Tên xe ── */}
                    <div className="search-field" onClick={e => e.stopPropagation()}>
                        <FaCar className="search-field-icon" style={{ color: 'var(--gray-400)' }} />
                        <div className="search-field-content">
                            <span className="search-field-label">Tìm kiếm xe</span>
                            <input
                                type="text"
                                className="search-input-name"
                                placeholder="VD: Mazda, Vios..."
                                value={carName}
                                onChange={(e) => setCarName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>

                    <button className="btn-search" onClick={e => { e.stopPropagation(); handleSearch(); }}>
                        <FaSearch style={{ marginRight: 8 }} />TÌM KIẾM
                    </button>
                </div>
            </section>

            {/* ── Modal ── */}
            {showModal && (
                <div className="sb-overlay" onClick={() => setShowModal(false)}>
                    <div className="sb-modal" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="sb-modal-header">
                            <span className="sb-modal-title">Tìm xe</span>
                            <button className="sb-modal-close" onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="sb-modal-body">

                            {/* ── Địa điểm display ── */}
                            <div className="sb-field-group">
                                <label className="sb-label">Địa điểm</label>
                                <div className="sb-loc-display">
                                    <FaMapMarkerAlt className="sb-loc-pin" />
                                    <span className={locLabel ? 'sb-loc-value' : 'sb-placeholder'}>
                                        {locLabel || 'Chọn địa điểm'}
                                    </span>
                                </div>
                            </div>

                            {/* ── Tên xe input (trong modal) ── */}
                            <div className="sb-field-group">
                                <label className="sb-label">Tìm kiếm xe</label>
                                <div className="sb-loc-display" style={{ padding: '8px 14px' }}>
                                    <FaCar className="sb-loc-pin" style={{ color: 'var(--gray-400)' }} />
                                    <input
                                        type="text"
                                        className="search-input-name"
                                        style={{ fontSize: '0.88rem' }}
                                        placeholder="Tìm theo tên xe..."
                                        value={carName}
                                        onChange={(e) => setCarName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>

                            {/* ── Bước 1: Chọn thành phố ── */}
                            <div className="sb-checklist-wrap">
                                <div className="sb-checklist-header">Chọn thành phố</div>

                                {CITIES.map(city => {
                                    const isActive = selectedCity === city;
                                    return (
                                        <div
                                            key={city}
                                            className={`sb-city-item ${isActive ? 'active' : ''}`}
                                            onClick={() => handleCityClick(city)}
                                        >
                                            <FaMapMarkerAlt className={`sb-city-pin ${isActive ? 'active' : ''}`} />
                                            <span className="sb-city-name">{city}</span>
                                            {isActive
                                                ? <FaCheck className="sb-city-check" />
                                                : <FaChevronRight className="sb-city-arrow" />
                                            }
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Bước 2: Chọn quận/huyện (hiện sau khi chọn TP) ── */}
                            {districts && (
                                <div className="sb-checklist-wrap sb-districts-wrap">
                                    <div className="sb-checklist-city">
                                        <FaMapMarkerAlt style={{ color: 'var(--primary)', marginRight: 6, flexShrink: 0 }} />
                                        Quận / Huyện — {selectedCity}
                                        {selectedDist && (
                                            <button className="sb-clear-inline" onClick={() => setDist('')}>
                                                Bỏ chọn
                                            </button>
                                        )}
                                    </div>

                                    {Object.entries(districts).map(([group, items]) => (
                                        <div key={group}>
                                            <div className="sb-group-label">{group}</div>
                                            {items.map(d => {
                                                const on = selectedDist === d;
                                                return (
                                                    <div
                                                        key={d}
                                                        className={`sb-check-item ${on ? 'on' : ''}`}
                                                        onClick={() => handleDistClick(d)}
                                                    >
                                                        <span className={`sb-radio-dot ${on ? 'on' : ''}`}>
                                                            {on && <span className="sb-radio-inner" />}
                                                        </span>
                                                        <span className="sb-check-label">{d}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}


                        </div>

                        {/* Footer */}
                        <div className="sb-modal-footer">
                            <button className="sb-submit-btn" onClick={handleSearch}>
                                Xác nhận
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default SearchBar;
