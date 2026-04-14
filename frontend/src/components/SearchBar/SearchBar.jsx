import React, { useState, useEffect, useId } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTimes, FaCheck, FaChevronRight, FaCar } from 'react-icons/fa';

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

const SearchBar = ({ onSearch }) => {
  const titleId = useId();
  const carNameId = useId();
  const [showModal, setShowModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDist, setDist] = useState('');
  const [carName, setCarName] = useState('');

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    const onKey = (e) => { if (e.key === 'Escape') setShowModal(false); };
    if (showModal) document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [showModal]);

  const handleCityClick = (city) => { setSelectedCity(city); setDist(''); };
  const handleDistClick = (d) => setDist(prev => prev === d ? '' : d);

  const handleSearch = () => {
    const location = selectedDist || selectedCity || '';
    if (onSearch) onSearch({ location, carName });
    setShowModal(false);
  };

  const districts = selectedCity ? CITY_DISTRICTS[selectedCity] : null;
  const locLabel = selectedCity && selectedDist
    ? `${selectedCity} - ${selectedDist}`
    : selectedCity || '';

  return (
    <>
      {/* Search bar */}
      <section className="py-10 px-5 bg-gradient-to-br from-[#f0fdf4] to-[#e8f8ef]">
        <h1 className="text-center text-[2rem] font-extrabold text-gray-900 mb-6 max-[600px]:text-[1.4rem] text-balance">
          Tìm xe tự lái
        </h1>
        <div className="max-w-[820px] mx-auto flex items-stretch bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden max-[640px]:flex-col max-[640px]:rounded-xl">
          {/* Location field — opens modal */}
          <button
            type="button"
            aria-label={locLabel ? `Địa điểm: ${locLabel} — thay đổi` : 'Chọn địa điểm tìm xe'}
            className="flex items-center gap-3 px-5 py-3.5 flex-1 border-r border-gray-100 max-[640px]:border-r-0 max-[640px]:border-b text-left transition-[background-color] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            onClick={() => setShowModal(true)}
          >
            <FaMapMarkerAlt aria-hidden="true" className="text-primary text-base shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[0.68rem] text-gray-400 font-semibold uppercase tracking-wide">Địa điểm</span>
              <span className={`text-[0.9rem] font-medium truncate ${locLabel ? 'text-gray-800' : 'text-gray-400'}`}>
                {locLabel || 'Chọn địa điểm tìm xe'}
              </span>
            </div>
          </button>

          {/* Car name field */}
          <div className="flex items-center gap-3 px-5 py-3.5 flex-1 border-r border-gray-100 max-[640px]:border-r-0 max-[640px]:border-b">
            <FaCar aria-hidden="true" className="text-gray-400 text-base shrink-0" />
            <div className="flex flex-col min-w-0 w-full">
              <label htmlFor={carNameId} className="text-[0.68rem] text-gray-400 font-semibold uppercase tracking-wide">Tìm kiếm xe</label>
              <input
                id={carNameId}
                type="search"
                name="car-name"
                autoComplete="off"
                className="text-[0.9rem] font-medium text-gray-800 bg-transparent border-none focus:outline-none placeholder:text-gray-400"
                placeholder="VD: Mazda, Vios…"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white font-bold text-[0.85rem] tracking-wide uppercase transition-colors hover:bg-primary-dark shrink-0 max-[640px]:py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
            onClick={handleSearch}
          >
            <FaSearch aria-hidden="true" />TÌM KIẾM
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-white w-full sm:max-w-[480px] sm:rounded-2xl rounded-t-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh] overscroll-contain"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 id={titleId} className="text-base font-bold text-gray-900">Tìm xe</h2>
              <button
                type="button"
                aria-label="Đóng"
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setShowModal(false)}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4 overscroll-contain">
              {/* Location display */}
              <div>
                <p className="text-[0.78rem] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Địa điểm đã chọn</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <FaMapMarkerAlt aria-hidden="true" className="text-primary shrink-0" />
                  <span className={`text-[0.9rem] ${locLabel ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                    {locLabel || 'Chọn địa điểm'}
                  </span>
                </div>
              </div>

              {/* Car name input */}
              <div>
                <label htmlFor={`${carNameId}-modal`} className="text-[0.78rem] font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Tìm kiếm xe</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                  <FaCar aria-hidden="true" className="text-gray-400 shrink-0" />
                  <input
                    id={`${carNameId}-modal`}
                    type="search"
                    name="car-name-modal"
                    autoComplete="off"
                    className="flex-1 bg-transparent border-none focus:outline-none text-[0.88rem] text-gray-800 placeholder:text-gray-400"
                    placeholder="Tìm theo tên xe…"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              {/* City selection */}
              <fieldset className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <legend className="sr-only">Chọn thành phố</legend>
                <div aria-hidden="true" className="px-4 py-2.5 bg-gray-100 text-[0.75rem] font-bold text-gray-500 uppercase tracking-wide">Chọn thành phố</div>
                {CITIES.map(city => {
                  const isActive = selectedCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                        ${isActive ? 'bg-primary-light' : 'hover:bg-white'}`}
                      onClick={() => handleCityClick(city)}
                    >
                      <FaMapMarkerAlt aria-hidden="true" className={isActive ? 'text-primary' : 'text-gray-400'} />
                      <span className={`flex-1 text-[0.9rem] font-medium ${isActive ? 'text-primary' : 'text-gray-700'}`}>{city}</span>
                      {isActive
                        ? <FaCheck aria-hidden="true" className="text-primary text-[0.8rem]" />
                        : <FaChevronRight aria-hidden="true" className="text-gray-300 text-[0.75rem]" />
                      }
                    </button>
                  );
                })}
              </fieldset>

              {/* District selection */}
              {districts && (
                <fieldset className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  <legend className="sr-only">Chọn quận / huyện tại {selectedCity}</legend>
                  <div className="px-4 py-2.5 bg-gray-100 text-[0.75rem] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <FaMapMarkerAlt aria-hidden="true" className="text-primary" />
                    Quận / Huyện — {selectedCity}
                    {selectedDist && (
                      <button
                        type="button"
                        className="ml-auto text-[0.72rem] text-primary underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                        onClick={() => setDist('')}
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                  {Object.entries(districts).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[0.7rem] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">{group}</div>
                      {items.map(d => {
                        const on = selectedDist === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-b-0 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                              ${on ? 'bg-primary-light' : 'hover:bg-white'}`}
                            onClick={() => handleDistClick(d)}
                          >
                            <span aria-hidden="true" className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${on ? 'border-primary' : 'border-gray-300'}`}>
                              {on && <span className="w-2 h-2 rounded-full bg-primary block" />}
                            </span>
                            <span className={`text-[0.88rem] ${on ? 'text-primary font-semibold' : 'text-gray-700'}`}>{d}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </fieldset>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl text-[0.95rem] transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={handleSearch}
              >
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
