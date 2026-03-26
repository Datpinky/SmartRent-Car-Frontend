import React, { useState, useEffect, useMemo } from 'react';
import SearchBar from '../../SearchBar/SearchBar';
import FilterBar from '../../FilterBar/FilterBar';
import CarGrid from '../../CarGrid/CarGrid';

import { cars } from '../../data/cars';

/* So khớp địa điểm theo đoạn — tránh "Quận 1" match "Quận 10/11/12" */
const matchLocation = (carLoc, search) => {
    if (!search) return true;
    const loc = carLoc.toLowerCase();
    const term = search.toLowerCase();
    const idx = loc.indexOf(term);
    if (idx === -1) return false;
    const charAfter = loc[idx + term.length];
    return charAfter === undefined || /[\s,.\/\-(]/.test(charAfter);
};

const Home = () => {
    const [loading, setLoading] = useState(true);

    /* ── State tìm kiếm (SearchBar) ── */
    const [searchParams, setSearchParams] = useState({ location: '', carName: '', showroomName: '' });

    /* ── State bộ lọc (FilterBar) ── */
    const [filterSelections, setFilterSelections] = useState({
        type: 'all', fuel: 'all', seats: 'all',
        model: 'all', brand: 'all', category: 'all',
    });

    /* ── State sắp xếp ── */
    const [sortValue, setSortValue] = useState('all');

    /* ── Key để force-remount SearchBar khi reset ── */
    const [searchKey, setSearchKey] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    /* ── Tổng hợp filter + search + sort bằng useMemo ── */
    const filteredCars = useMemo(() => {
        const { location, carName, showroomName } = searchParams;
        const { type, fuel, seats, model, brand, category } = filterSelections;


        let result = cars.filter(c => {
            // -- SearchBar conditions --
            const matchLoc = matchLocation(c.address, location);
            const matchName = !carName ||
                c.name.toLowerCase().includes(carName.toLowerCase());
            const matchShowroom = !showroomName ||
                (c.showroom && c.showroom.toLowerCase().includes(showroomName.toLowerCase()));

            // -- FilterBar conditions --
            const matchType = type === 'all' || c.type === type;
            const matchFuel = fuel === 'all' || c.fuel === fuel;
            const matchSeats = seats === 'all' || c.seats === parseInt(seats, 10);
            const matchModel = model === 'all' || c.transmission === model;
            const matchBrand = brand === 'all' || c.brand === brand;
            const matchCategory = category === 'all' || c.category === category;

            return matchLoc && matchName && matchShowroom
                && matchType && matchFuel && matchSeats
                && matchModel && matchBrand && matchCategory;
        });

        // -- Sort --
        if (sortValue === 'price_asc') result = [...result].sort((a, b) => a.price - b.price);
        if (sortValue === 'price_desc') result = [...result].sort((a, b) => b.price - a.price);

        return result;
    }, [searchParams, filterSelections, sortValue]);

    /* ── Handlers ── */
    const handleSearch = ({ location, carName, showroomName }) => {
        setSearchParams({ location: location || '', carName: carName || '', showroomName: showroomName || '' });
    };

    const handleFilter = (payload) => {
        if (payload === 'all') {
            // Reset toàn bộ: filter + search + sort
            setFilterSelections({ type: 'all', fuel: 'all', seats: 'all', model: 'all', brand: 'all', category: 'all' });
            setSearchParams({ location: '', carName: '', showroomName: '' });
            setSortValue('all');
            setSearchKey(k => k + 1); // force SearchBar remount → xóa sạch input
            return;
        }
        if (typeof payload === 'object' && payload !== null) {
            setFilterSelections(prev => ({ ...prev, ...payload }));
        }
    };

    const handleSort = (val) => setSortValue(val);

    return (
        <main>
            <SearchBar key={searchKey} onSearch={handleSearch} />
            <FilterBar onFilter={handleFilter} onSort={handleSort} />
            <CarGrid cars={filteredCars} loading={loading} />
        </main>
    );
};

export default Home;
