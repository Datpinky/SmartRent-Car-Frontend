import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../../SearchBar/SearchBar';
import FilterBar from '../../FilterBar/FilterBar';
import CarGrid from '../../CarGrid/CarGrid';
import vehicleService from '../../../services/vehicleService';

const Home = () => {
    const [allCars, setAllCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const currentFilters = useRef({
        type: 'all', fuel: 'all', seats: 'all', model: 'all',
        brand: 'all', category: 'all', area: 'all',
        priceMin: '', priceMax: '',
    });
    const currentSearch = useRef({ location: '', carName: '' });
    const currentSort = useRef('all');

    useEffect(() => {
        let cancelled = false;

        const loadVehicles = async () => {
            setLoading(true);
            try {
                const { data } = await vehicleService.getList({ limit: 100 });
                if (cancelled) return;
                setAllCars(data || []);
                setFilteredCars(data || []);
                setApiError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('[Home] API error:', err.message);
                setApiError('Không thể lấy danh sách xe từ máy chủ.');
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

        return base.filter(c => {
            const matchType = type === 'all' || c.type === type;
            const matchFuel = fuel === 'all' || c.fuel === fuel;
            const matchSeats = seats === 'all' || c.seats === parseInt(seats, 10);
            const matchModel = model === 'all' || c.transmission === model;
            const matchBrand = !brand || brand === 'all' || c.brand === brand;
            const matchCategory = !category || category === 'all' || c.category === category;
            const matchArea = !area || area === 'all' || (c.location || '').includes(area);
            const matchLoc = !location || (c.location || '').toLowerCase().includes(location.toLowerCase()) || (c.address || '').toLowerCase().includes(location.toLowerCase());
            const matchName = !carName || (c.name || '').toLowerCase().includes(carName.toLowerCase());
            const matchPrice = (!hasMinPrice || c.price >= minPrice) && (!hasMaxPrice || c.price <= maxPrice);

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
            const reset = { type: 'all', fuel: 'all', seats: 'all', model: 'all', brand: 'all', category: 'all', area: 'all', priceMin: '', priceMax: '' };
            currentFilters.current = reset;
            currentSort.current = 'all';
            refreshCars(reset, currentSearch.current, 'all');
        } else if (payload === 'premium') {
            setFilteredCars(allCars.filter(c => c.price >= 900));
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
                        <span className="font-semibold">⚠ Chế độ offline:</span>
                        {apiError} — đang hiển thị dữ liệu mẫu.
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
