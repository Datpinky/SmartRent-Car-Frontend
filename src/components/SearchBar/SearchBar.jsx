import React, { useState } from 'react';
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
  const [showModal, setShowModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDist, setDist] = useState('');
  const [carName, setCarName] = useState('');
  const handleCityClick = (city) => {
    setSelectedCity(city);
    setDist('');
  };
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
        <h1 className="text-center text-[2rem] font-extrabold text-gray-900 mb-6 max-[600px]:text-[1.4rem]">
          Tìm xe tự lái
        </h1>
        <div
          className="max-w-[820px] mx-auto flex items-stretch bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg max-[640px]:flex-col max-[640px]:rounded-xl"
          onClick={() => setShowModal(true)}
        >
          {/* Location field */}
          <div className="flex items-center gap-3 px-5 py-3.5 flex-1 border-r border-gray-100 max-[640px]:border-r-0 max-[640px]:border-b">
            <FaMapMarkerAlt className="text-primary text-base shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[0.68rem] text-gray-400 font-semibold uppercase tracking-wide">Địa điểm</span>
              <span className={`text-[0.9rem] font-medium truncate ${locLabel ? 'text-gray-800' : 'text-gray-400'}`}>
                {locLabel || 'Chọn địa điểm tìm xe'}
              </span>
            </div>
          </div>

          {/* Car name field */}
          <div
            className="flex items-center gap-3 px-5 py-3.5 flex-1 border-r border-gray-100 max-[640px]:border-r-0 max-[640px]:border-b"
            onClick={e => e.stopPropagation()}
          >
            <FaCar className="text-gray-400 text-base shrink-0" />
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[0.68rem] text-gray-400 font-semibold uppercase tracking-wide">Tìm kiếm xe</span>
              <input
                type="text"
                className="text-[0.9rem] font-medium text-gray-800 bg-transparent border-none outline-none placeholder:text-gray-400"
                placeholder="VD: Mazda, Vios..."
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <button
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white font-bold text-[0.85rem] tracking-wide uppercase transition-colors hover:bg-primary-dark shrink-0 max-[640px]:py-4"
            onClick={e => { e.stopPropagation(); handleSearch(); }}
          >
            <FaSearch />TÌM KIẾM
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-[480px] sm:rounded-2xl rounded-t-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <span className="text-base font-bold text-gray-900">Tìm xe</span>
              <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
              {/* Location display */}
              <div>
                <label className="text-[0.78rem] font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Địa điểm</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <FaMapMarkerAlt className="text-primary shrink-0" />
                  <span className={`text-[0.9rem] ${locLabel ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                    {locLabel || 'Chọn địa điểm'}
                  </span>
                </div>
              </div>

              {/* Car name input */}
              <div>
                <label className="text-[0.78rem] font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Tìm kiếm xe</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <FaCar className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-[0.88rem] text-gray-800 placeholder:text-gray-400"
                    placeholder="Tìm theo tên xe..."
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              {/* City selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.75rem] font-bold text-gray-600 uppercase tracking-wide">Chọn thành phố</span>
                  {selectedCity && (
                    <button 
                      className="text-[0.72rem] text-primary font-semibold hover:underline"
                      onClick={() => { setSelectedCity(null); setDist(''); }}
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>
                <div>
                  {CITIES.map(city => {
                    const isActive = selectedCity === city;
                    return (
                      <div
                        key={city}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors
                          ${isActive ? 'bg-primary-light' : 'hover:bg-white'}`}
                        onClick={() => handleCityClick(city)}
                      >
                        <FaMapMarkerAlt className={isActive ? 'text-primary' : 'text-gray-400'} />
                        <span className={`flex-1 text-[0.9rem] font-medium ${isActive ? 'text-primary' : 'text-gray-700'}`}>{city}</span>
                        {isActive
                          ? <FaCheck className="text-primary text-[0.8rem]" />
                          : <FaChevronRight className="text-gray-300 text-[0.75rem]" />
                        }
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* District selection */}
              {districts && (
                <div>
                  <div className="text-[0.75rem] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <FaMapMarkerAlt className="text-primary" />
                    <span className="flex-1">Quận / Huyện — {selectedCity}</span>
                  </div>
                  <div>
                    {Object.entries(districts).map(([group, items]) => (
                      <div key={group}>
                        <div className="py-1.5 text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">{group}</div>
                        {items.map(d => {
                          const on = selectedDist === d;
                          return (
                            <div
                              key={d}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors
                                ${on ? 'bg-primary-light' : 'hover:bg-white'}`}
                              onClick={() => handleDistClick(d)}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${on ? 'border-primary' : 'border-gray-300'}`}>
                                {on && <span className="w-2 h-2 rounded-full bg-primary block" />}
                              </span>
                              <span className={`text-[0.88rem] ${on ? 'text-primary font-semibold' : 'text-gray-700'}`}>{d}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl text-[0.95rem] transition-colors hover:bg-primary-dark"
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
