import React, { useEffect, useRef, useState } from 'react';
import SearchBar from '../../SearchBar/SearchBar';
import FilterBar from '../../FilterBar/FilterBar';
import CarGrid from '../../CarGrid/CarGrid';
import vehicleLocationService from '../../../services/vehicleLocationService';
import vehicleService from '../../../services/vehicleService';

const logLocationResults = (results = []) => {
  if (!results.length) {
    return;
  }

  console.groupCollapsed('[Home][VehicleLocation] debug (after getManyByVehicleIds)');
  results.forEach((item) => {
    if (item.data?.address) {
      console.info('[Home][VehicleLocation] OK', {
        vehicleId: item.vehicleId,
        address: item.data.address,
      });
      return;
    }

    if (item.data && !item.data.address) {
      console.warn('[Home][VehicleLocation] MISSING address field', {
        vehicleId: item.vehicleId,
        location: item.data,
      });
      return;
    }

    console.error('[Home][VehicleLocation] FAIL', {
      vehicleId: item.vehicleId,
      status: item.error?.status,
      message: item.error?.message,
    });
  });
  console.groupEnd();
};

const Home = () => {
  const [allCars, setAllCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const currentFilters = useRef({
    type: 'all',
    fuel: 'all',
    seats: 'all',
    model: 'all',
    brand: 'all',
    category: 'all',
    area: 'all',
    priceMin: '',
    priceMax: '',
  });
  const currentSearch = useRef({ location: '', carName: '' });
  const currentSort = useRef('all');

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      setLoading(true);
      try {
        const { data } = await vehicleService.getList({ limit: 100 });
        const availableCars = (data || []).filter((car) => car.active !== false && car.status === 'available');
        const token = localStorage.getItem('smartrent_token');

        let mergedCars = availableCars;

        if (token && availableCars.length > 0) {
          const locationResults = await vehicleLocationService.getManyByVehicleIds(
            availableCars.map((car) => car._id || car.id)
          );
          const locationMap = new Map(
            locationResults.map((item) => [String(item.vehicleId), item.data])
          );

          logLocationResults(locationResults);

          mergedCars = availableCars.map((car) => {
            const location = locationMap.get(String(car._id || car.id));
            const address = location?.address || car.address || '';

            const nextCar = {
              ...car,
              address,
              location: address || car.location || '',
              latitude: location?.latitude || car.latitude || null,
              longitude: location?.longitude || car.longitude || null,
              plusCode: location?.plusCode || car.plusCode || '',
            };

            if (!nextCar.address) {
              console.warn('[Home][VehicleLocation] card fallback without address', {
                vehicleId: nextCar._id || nextCar.id,
                name: nextCar.name,
                currentLocation: nextCar.location,
              });
            }

            return nextCar;
          });
        } else if (!token) {
          console.info('[Home][VehicleLocation] missing token, skip location enrichment');
        }

        if (cancelled) return;
        setAllCars(mergedCars);
        setFilteredCars(mergedCars);
        setApiError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('[Home] API error:', err.message);
        setApiError('Khong the lay danh sach xe tu may chu.');
        setAllCars([]);
        setFilteredCars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadVehicles();
    return () => { cancelled = true; };
  }, []);

  const applyFilters = (base, filters, search) => {
    const { type, fuel, seats, model, brand, category, area, priceMin, priceMax } = filters;
    const { location, carName } = search;
    const minPrice = Number(priceMin);
    const maxPrice = Number(priceMax);
    const hasMinPrice = String(priceMin || '').trim() !== '' && Number.isFinite(minPrice);
    const hasMaxPrice = String(priceMax || '').trim() !== '' && Number.isFinite(maxPrice);

    return base.filter((car) => {
      const matchType = type === 'all' || car.type === type;
      const matchFuel = fuel === 'all' || car.fuel === fuel;
      const matchSeats = seats === 'all' || car.seats === Number.parseInt(seats, 10);
      const matchModel = model === 'all' || car.transmission === model;
      const matchBrand = !brand || brand === 'all' || car.brand === brand;
      const matchCategory = !category || category === 'all' || car.category === category;
      const matchArea = !area || area === 'all' || (car.location || '').includes(area) || (car.address || '').includes(area);
      const matchLoc =
        !location
        || (car.location || '').toLowerCase().includes(location.toLowerCase())
        || (car.address || '').toLowerCase().includes(location.toLowerCase());
      const matchName = !carName || (car.name || '').toLowerCase().includes(carName.toLowerCase());
      const matchPrice = (!hasMinPrice || car.price >= minPrice) && (!hasMaxPrice || car.price <= maxPrice);

      return matchType && matchFuel && matchSeats && matchModel && matchBrand && matchCategory && matchArea && matchLoc && matchName && matchPrice;
    });
  };

  const sortCars = (cars, sortValue) => {
    const sorted = [...cars];
    if (sortValue === 'price_asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortValue === 'price_desc') sorted.sort((a, b) => b.price - a.price);
    return sorted;
  };

  const refreshCars = (filters = currentFilters.current, search = currentSearch.current, sortValue = currentSort.current) => {
    const filtered = applyFilters(allCars, filters, search);
    setFilteredCars(sortCars(filtered, sortValue));
  };

  const handleFilter = (payload) => {
    if (typeof payload === 'object' && payload !== null) {
      currentFilters.current = { ...currentFilters.current, ...payload };
      refreshCars(currentFilters.current, currentSearch.current, currentSort.current);
      return;
    }

    if (payload === 'all') {
      const reset = {
        type: 'all',
        fuel: 'all',
        seats: 'all',
        model: 'all',
        brand: 'all',
        category: 'all',
        area: 'all',
        priceMin: '',
        priceMax: '',
      };
      currentFilters.current = reset;
      currentSort.current = 'all';
      refreshCars(reset, currentSearch.current, 'all');
    }
  };

  const handleSearch = ({ location, carName }) => {
    currentSearch.current = { location, carName };
    refreshCars(currentFilters.current, { location, carName }, currentSort.current);
  };

  const handleSort = (sortValue) => {
    currentSort.current = sortValue;
    refreshCars(currentFilters.current, currentSearch.current, sortValue);
  };

  return (
    <main>
      {apiError && (
        <div className="max-w-[1280px] mx-auto px-5 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-700 text-[0.82rem] flex items-center gap-2">
            <span className="font-semibold">Canh bao:</span>
            {apiError}
          </div>
        </div>
      )}
      <SearchBar onSearch={handleSearch} />
      <FilterBar onFilter={handleFilter} onSort={handleSort} />
      <CarGrid cars={filteredCars} loading={loading} />
    </main>
  );
};

export default Home;
