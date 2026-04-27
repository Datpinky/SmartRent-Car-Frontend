import React, { useEffect, useRef, useState } from 'react';
import CarGrid from '../../CarGrid/CarGrid';
import FilterBar from '../../FilterBar/FilterBar';
import SearchBar from '../../SearchBar/SearchBar';
import bookingService from '../../../services/bookingService';
import reviewService from '../../../services/reviewService';
import vehicleService from '../../../services/vehicleService';

const DEFAULT_FILTERS = {
  seats: 'all',
  model: 'all',
  brand: 'all',
  category: 'all',
  fuel: 'all',
  priceMin: '',
  priceMax: '',
};

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const matchesExact = (actualValue, selectedValue) => {
  if (!selectedValue || selectedValue === 'all') {
    return true;
  }

  return normalizeText(actualValue) === normalizeText(selectedValue);
};

const matchesContains = (source, keyword) => {
  if (!keyword) {
    return true;
  }

  return normalizeText(source).includes(normalizeText(keyword));
};

const sortVehicles = (vehicles, sortValue) => {
  if (!sortValue || sortValue === 'all') {
    return vehicles;
  }

  const sorted = [...vehicles];
  if (sortValue === 'price_asc') {
    sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }
  if (sortValue === 'price_desc') {
    sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }
  return sorted;
};

const applyFilters = (baseVehicles, filters, search, sortValue) => {
  const filtered = baseVehicles.filter((vehicle) => {
    const price = Number(vehicle.price || 0);
    const minPrice = toNumber(filters.priceMin);
    const maxPrice = toNumber(filters.priceMax);
    const vehicleLocation = vehicle.address || vehicle.pickupAddress || vehicle.location || '';

    const matchSeats = filters.seats === 'all' || Number(vehicle.seats || 0) === Number(filters.seats);
    const matchModel = matchesExact(vehicle.transmission, filters.model);
    const matchBrand = matchesExact(vehicle.brand, filters.brand);
    const matchCategory = matchesExact(vehicle.category || vehicle.type, filters.category);
    const matchFuel = matchesExact(vehicle.fuel, filters.fuel);
    const matchPriceMin = minPrice == null || price >= minPrice;
    const matchPriceMax = maxPrice == null || price <= maxPrice;
    const matchLocation = matchesContains(vehicleLocation, search.location);
    const matchCarName = matchesContains(vehicle.name, search.carName);

    return (
      matchSeats &&
      matchModel &&
      matchBrand &&
      matchCategory &&
      matchFuel &&
      matchPriceMin &&
      matchPriceMax &&
      matchLocation &&
      matchCarName
    );
  });

  return sortVehicles(filtered, sortValue);
};

const hasAvailabilityRange = (search) => Boolean(search?.pickupDate && search?.returnDate);

const Home = () => {
  const [allCars, setAllCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [apiError, setApiError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  const currentFilters = useRef(DEFAULT_FILTERS);
  const currentSearch = useRef({ location: '', carName: '', pickupDate: '', returnDate: '' });
  const currentSort = useRef('all');
  const availabilityRequestRef = useRef(0);
  const isMountedRef = useRef(true);

  const syncVisibleCars = async (
    baseVehicles,
    nextFilters = currentFilters.current,
    nextSearch = currentSearch.current,
    nextSort = currentSort.current
  ) => {
    const requestId = ++availabilityRequestRef.current;
    const locallyFiltered = applyFilters(baseVehicles, nextFilters, nextSearch, nextSort);

    if (!hasAvailabilityRange(nextSearch) || locallyFiltered.length === 0) {
      if (!isMountedRef.current || requestId !== availabilityRequestRef.current) {
        return;
      }

      setFilteredCars(locallyFiltered);
      setAvailabilityError('');
      setCheckingAvailability(false);
      return;
    }

    setCheckingAvailability(true);

    const availabilityResults = await Promise.allSettled(
      locallyFiltered.map((vehicle) =>
        bookingService.checkAvailability({
          vehicleId: vehicle.id,
          pickupDate: nextSearch.pickupDate,
          returnDate: nextSearch.returnDate,
        })
      )
    );

    if (!isMountedRef.current || requestId !== availabilityRequestRef.current) {
      return;
    }

    let failedCount = 0;

    const availableCars = locallyFiltered.filter((vehicle, index) => {
      const result = availabilityResults[index];

      if (result?.status !== 'fulfilled') {
        failedCount += 1;
        return true;
      }

      if (result.value?.isAvailable === false) {
        return false;
      }

      return true;
    });

    setFilteredCars(availableCars);
    setAvailabilityError(
      failedCount > 0
        ? 'Khong the kiem tra lich thue cua mot so xe. Danh sach dang hien thi theo ket qua du phong.'
        : ''
    );
    setCheckingAvailability(false);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      availabilityRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const { data } = await vehicleService.getList({ limit: 100 });
        const vehiclesWithReviewSummary = await reviewService.enrichVehiclesWithSummary(data, { limit: 100 });
        if (cancelled) {
          return;
        }

        setAllCars(vehiclesWithReviewSummary);
        await syncVisibleCars(vehiclesWithReviewSummary);
        setApiError('');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAllCars([]);
        setFilteredCars([]);
        setApiError(error.message || 'Khong the tai du lieu xe tu backend.');
      } finally {
        if (!cancelled) {
          setLoadingVehicles(false);
        }
      }
    };

    loadVehicles();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilter = (payload) => {
    if (payload === 'all') {
      currentFilters.current = DEFAULT_FILTERS;
      void syncVisibleCars(allCars, DEFAULT_FILTERS, currentSearch.current, currentSort.current);
      return;
    }

    if (typeof payload === 'object' && payload !== null) {
      currentFilters.current = { ...currentFilters.current, ...payload };
      void syncVisibleCars(allCars, currentFilters.current, currentSearch.current, currentSort.current);
    }
  };

  const handleSearch = ({ location, carName, pickupDate = '', returnDate = '' }) => {
    currentSearch.current = { location, carName, pickupDate, returnDate };
    void syncVisibleCars(allCars, currentFilters.current, currentSearch.current, currentSort.current);
  };

  const handleSort = (sortValue) => {
    currentSort.current = sortValue;
    void syncVisibleCars(allCars, currentFilters.current, currentSearch.current, currentSort.current);
  };

  const loading = loadingVehicles || checkingAvailability;

  return (
    <main>
      {apiError && (
        <div className="mx-auto max-w-[1280px] px-5 pt-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.82rem] text-red-700">
            <span className="font-semibold">Khong the tai danh sach xe tu he thong.</span> {apiError}
          </div>
        </div>
      )}

      {availabilityError && (
        <div className="mx-auto max-w-[1280px] px-5 pt-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[0.82rem] text-amber-800">
            <span className="font-semibold">Khong the kiem tra trung lich cho mot so xe.</span> {availabilityError}
          </div>
        </div>
      )}

      <SearchBar onSearch={handleSearch} />
      <FilterBar onFilter={handleFilter} onSort={handleSort} />
      <CarGrid cars={filteredCars} loading={loading} rentalSearch={currentSearch.current} />
    </main>
  );
};

export default Home;
