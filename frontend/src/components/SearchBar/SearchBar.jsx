<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaCalendarAlt,
  FaCar,
  FaCheck,
  FaChevronRight,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
=======
import React, { useState, useEffect, useMemo } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTimes, FaCheck, FaChevronRight, FaCar, FaCalendarAlt } from 'react-icons/fa';
>>>>>>> 0ae3050dbf544bc22f5b8f8e4bd378c9199a9f54
import { lockPageScroll, unlockPageScroll } from '../../utils/scrollLock';

const CITIES = ['Ha Noi', 'Da Nang', 'Ho Chi Minh'];

const CITY_DISTRICTS = {
  'Da Nang': {
    Quan: ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu', 'Cam Le'],
    Huyen: ['Hoa Vang'],
  },
  'Ho Chi Minh': {
    Quan: ['Quan 1', 'Quan 3', 'Quan 4', 'Quan 5', 'Quan 6', 'Quan 7', 'Quan 8', 'Quan 10', 'Quan 11', 'Quan 12', 'Binh Thanh', 'Go Vap', 'Tan Binh', 'Tan Phu', 'Phu Nhuan', 'Binh Tan'],
    Huyen: ['Binh Chanh', 'Cu Chi', 'Hoc Mon', 'Nha Be', 'Can Gio'],
  },
  'Ha Noi': {
    Quan: ['Ba Dinh', 'Hoan Kiem', 'Hai Ba Trung', 'Dong Da', 'Cau Giay', 'Thanh Xuan', 'Hoang Mai', 'Long Bien', 'Nam Tu Liem', 'Bac Tu Liem', 'Tay Ho', 'Ha Dong'],
    Huyen: ['Dong Anh', 'Gia Lam', 'Soc Son', 'Thanh Tri', 'Hoai Duc'],
  },
};

const parseDateTime = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const pad2 = (value) => String(value).padStart(2, '0');

const toLocalInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const buildDefaultPickupDate = () => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 2);
  return toLocalInputValue(date);
};

const buildDefaultReturnDate = (pickupValue) => {
  const pickupDate = parseDateTime(pickupValue) || new Date();
  const next = new Date(pickupDate);
  next.setDate(next.getDate() + 2);
  return toLocalInputValue(next);
};

const formatDateTimeShort = (value) => {
  const date = parseDateTime(value);
  if (!date) {
    return '';
  }

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SearchBar = ({ onSearch }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [carName, setCarName] = useState('');
  const [pickupDate, setPickupDate] = useState(() => buildDefaultPickupDate());
  const [returnDate, setReturnDate] = useState(() => buildDefaultReturnDate(buildDefaultPickupDate()));
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }
    lockPageScroll();
    const onKey = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockPageScroll();
    };
  }, [showModal]);

  useEffect(() => {
    const pickup = parseDateTime(pickupDate);
    const ret = parseDateTime(returnDate);

    if (pickup && ret && ret <= pickup) {
      setReturnDate(buildDefaultReturnDate(pickupDate));
    }
  }, [pickupDate, returnDate]);

  const districts = selectedCity ? CITY_DISTRICTS[selectedCity] : null;

  const locationLabel = useMemo(() => {
    if (selectedCity && selectedDistrict) {
      return `${selectedDistrict}, ${selectedCity}`;
    }

    return selectedCity || '';
  }, [selectedCity, selectedDistrict]);

  const rentalWindowLabel = useMemo(() => {
    const pickupLabel = formatDateTimeShort(pickupDate);
    const returnLabel = formatDateTimeShort(returnDate);

    if (!pickupLabel || !returnLabel) {
      return 'Chon ngay nhan va tra xe';
    }

    return `${pickupLabel} - ${returnLabel}`;
  }, [pickupDate, returnDate]);

  const handleSearch = () => {
    const pickup = parseDateTime(pickupDate);
    const ret = parseDateTime(returnDate);

    if (!pickup || !ret) {
      setSearchError('Vui long chon day du ngay nhan xe va ngay tra xe.');
      return;
    }

    if (ret <= pickup) {
      setSearchError('Ngay tra xe phai sau ngay nhan xe.');
      return;
    }

    setSearchError('');
    onSearch?.({
      location: locationLabel,
      carName,
      pickupDate,
      returnDate,
    });
    setShowModal(false);
  };

  const handleReset = () => {
    const nextPickupDate = buildDefaultPickupDate();
    setSelectedCity(null);
    setSelectedDistrict('');
    setCarName('');
    setPickupDate(nextPickupDate);
    setReturnDate(buildDefaultReturnDate(nextPickupDate));
    setSearchError('');
  };

  return (
    <>
      <section className="bg-gradient-to-br from-[#f0fdf4] to-[#e8f8ef] px-5 py-10">
        <h1 className="mb-6 text-center text-[2rem] font-extrabold text-gray-900 max-[600px]:text-[1.4rem]">
          Tim xe tu lai
        </h1>

        <button
          type="button"
          className="mx-auto flex w-full max-w-[1040px] items-stretch overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-md transition-shadow hover:shadow-lg max-[860px]:flex-col max-[860px]:rounded-xl"
          onClick={() => setShowModal(true)}
        >
          <div className="flex flex-1 items-center gap-3 border-r border-gray-100 px-5 py-3.5 max-[860px]:border-b max-[860px]:border-r-0">
            <FaMapMarkerAlt className="shrink-0 text-base text-primary" />
            <div className="min-w-0">
              <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-gray-400">Dia diem</div>
              <div className={`truncate text-[0.92rem] font-medium ${locationLabel ? 'text-gray-800' : 'text-gray-400'}`}>
                {locationLabel || 'Chon dia diem tim xe'}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 border-r border-gray-100 px-5 py-3.5 max-[860px]:border-b max-[860px]:border-r-0">
            <FaCar className="shrink-0 text-base text-gray-400" />
            <div className="min-w-0">
              <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-gray-400">Tim theo ten xe</div>
              <div className={`truncate text-[0.92rem] font-medium ${carName ? 'text-gray-800' : 'text-gray-400'}`}>
                {carName || 'Mazda, Vios, VF e34...'}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 px-5 py-3.5 max-[860px]:border-b max-[860px]:border-gray-100">
            <FaCalendarAlt className="shrink-0 text-base text-gray-400" />
            <div className="min-w-0">
              <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-gray-400">Thoi gian thue</div>
              <div className="truncate text-[0.92rem] font-medium text-gray-800">
                {rentalWindowLabel}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-2 bg-primary px-7 py-3.5 text-[0.85rem] font-bold uppercase tracking-wide text-white max-[860px]:py-4">
            <FaSearch />
            Tim kiem
          </div>
        </button>
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:max-w-[560px] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="text-base font-bold text-gray-900">Tim xe</span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-gray-600">
                  Dia diem
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                  <FaMapMarkerAlt className="shrink-0 text-primary" />
                  <span className={`text-[0.9rem] ${locationLabel ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                    {locationLabel || 'Chon thanh pho hoac quan huyen'}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-gray-600">
                  Ten xe
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                  <FaCar className="shrink-0 text-gray-400" />
                  <input
                    type="text"
                    className="flex-1 border-none bg-transparent text-[0.88rem] text-gray-800 outline-none placeholder:text-gray-400"
                    placeholder="Tim theo ten xe..."
                    value={carName}
                    onChange={(event) => setCarName(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-gray-600">
                    Ngay nhan xe
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                    <input
                      type="datetime-local"
                      className="w-full border-none bg-transparent text-[0.88rem] text-gray-800 outline-none"
                      value={pickupDate}
                      min={buildDefaultPickupDate()}
                      onChange={(event) => setPickupDate(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-gray-600">
                    Ngay tra xe
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                    <input
                      type="datetime-local"
                      className="w-full border-none bg-transparent text-[0.88rem] text-gray-800 outline-none"
                      value={returnDate}
                      min={pickupDate}
                      onChange={(event) => setReturnDate(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              {searchError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.82rem] text-red-700">
                  {searchError}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.75rem] font-bold uppercase tracking-wide text-gray-600">Chon thanh pho</span>
                  {selectedCity && (
                    <button
                      type="button"
                      className="text-[0.72rem] font-semibold text-primary hover:underline"
                      onClick={() => {
                        setSelectedCity(null);
                        setSelectedDistrict('');
                      }}
                    >
                      Bo chon
                    </button>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  {CITIES.map((city) => {
                    const isActive = selectedCity === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
                          isActive ? 'bg-primary-light' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedCity(city);
                          setSelectedDistrict('');
                        }}
                      >
                        <FaMapMarkerAlt className={isActive ? 'text-primary' : 'text-gray-400'} />
                        <span className={`flex-1 text-[0.9rem] font-medium ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                          {city}
                        </span>
                        {isActive ? <FaCheck className="text-[0.8rem] text-primary" /> : <FaChevronRight className="text-[0.75rem] text-gray-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {districts && (
                <div>
                  <div className="mb-2 text-[0.75rem] font-bold uppercase tracking-wide text-gray-600">
                    Quan / huyen - {selectedCity}
                  </div>

                  <div className="max-h-[260px] overflow-y-auto rounded-2xl border border-gray-100">
                    {Object.entries(districts).map(([group, items]) => (
                      <div key={group}>
                        <div className="border-b border-gray-100 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                          {group}
                        </div>
                        {items.map((district) => {
                          const isActive = selectedDistrict === district;
                          return (
                            <button
                              key={district}
                              type="button"
                              className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                                isActive ? 'bg-primary-light' : 'bg-white hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedDistrict((current) => (current === district ? '' : district))}
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${isActive ? 'border-primary' : 'border-gray-300'}`}>
                                {isActive && <span className="block h-2 w-2 rounded-full bg-primary" />}
                              </span>
                              <span className={`text-[0.88rem] ${isActive ? 'font-semibold text-primary' : 'text-gray-700'}`}>
                                {district}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4">
              <div className="flex w-full items-center gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-[0.92rem] font-semibold text-gray-600 hover:border-gray-300"
                  onClick={handleReset}
                >
                  Xoa
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-primary py-3 text-[0.95rem] font-bold text-white transition-colors hover:bg-primary-dark"
                  onClick={handleSearch}
                >
                  Xac nhan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;
