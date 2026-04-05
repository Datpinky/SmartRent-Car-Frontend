import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../../SearchBar/SearchBar';
import FilterBar from '../../FilterBar/FilterBar';
import CarGrid from '../../CarGrid/CarGrid';
import { cars as MOCK_CARS } from '../../data/cars';
import vehicleService from '../../../services/vehicleService';

const Home = () => {
    const [allCars, setAllCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const currentFilters = useRef({
        type: 'all', fuel: 'all', seats: 'all', model: 'all',
        brand: 'all', category: 'all', area: 'all',
    });
    const currentSearch = useRef({ location: '', carName: '' });

    useEffect(() => {
        let cancelled = false;

        const loadVehicles = async () => {
            setLoading(true);
            try {
                const { data } = await vehicleService.getList({ limit: 100 });
                if (cancelled) return;
                if (data.length > 0) {
                    setAllCars(data);
                    setFilteredCars(data);
                    setApiError(null);
                } else {
                    // API available but no vehicles seeded → show mock
                    setAllCars(MOCK_CARS);
                    setFilteredCars(MOCK_CARS);
                    setApiError(null);
                }
            } catch (err) {
                if (cancelled) return;
                console.warn('[Home] API unavailable, falling back to mock data:', err.message);
                setAllCars(MOCK_CARS);
                setFilteredCars(MOCK_CARS);
                setApiError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadVehicles();
        return () => { cancelled = true; };
    }, []);

    const applyFilters = (base, filters, search) => {
        const { type, fuel, seats, model, brand, category, area } = filters;
        const { location, carName } = search;
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
            return matchType && matchFuel && matchSeats && matchModel && matchBrand && matchCategory && matchArea && matchLoc && matchName;
        });
    };

    const handleFilter = (payload) => {
        if (typeof payload === 'object' && payload !== null) {
            currentFilters.current = { ...currentFilters.current, ...payload };
            setFilteredCars(applyFilters(allCars, currentFilters.current, currentSearch.current));
            return;
        }
        if (payload === 'all') {
            const reset = { type: 'all', fuel: 'all', seats: 'all', model: 'all', brand: 'all', category: 'all', area: 'all' };
            currentFilters.current = reset;
            setFilteredCars(applyFilters(allCars, reset, currentSearch.current));
        } else if (payload === 'premium') {
            setFilteredCars(allCars.filter(c => c.price >= 900));
        }
    };

    const handleSearch = ({ location, carName }) => {
        currentSearch.current = { location, carName };
        setFilteredCars(applyFilters(allCars, currentFilters.current, { location, carName }));
    };

    const handleSort = (sortValue) => {
        setFilteredCars(prev => {
            const sorted = [...prev];
            if (sortValue === 'price_asc') sorted.sort((a, b) => a.price - b.price);
            else if (sortValue === 'price_desc') sorted.sort((a, b) => b.price - a.price);
            return sorted;
        });
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
