import React, { useState, useEffect } from 'react';
import SearchBar from '../../SearchBar/SearchBar';
import FilterBar from '../../FilterBar/FilterBar';
import CarGrid from '../../CarGrid/CarGrid';

import { cars } from '../../data/cars';

const Home = () => {
    const [filteredCars, setFilteredCars] = useState(cars);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const handleFilter = (payload) => {
        // ── Nhận object selections từ FilterBar (AND logic) ──
        if (typeof payload === 'object' && payload !== null) {
            const { type, fuel, seats, model, brand, category, area } = payload;
            setFilteredCars(cars.filter(c => {
                const matchType = type === 'all' || c.type === type;
                const matchFuel = fuel === 'all' || c.fuel === fuel;
                const matchSeats = seats === 'all' || c.seats === parseInt(seats, 10);
                const matchModel = model === 'all' || c.transmission === model;
                const matchBrand = !brand || brand === 'all' || c.brand === brand;
                const matchCategory = !category || category === 'all' || c.category === category;
                const matchArea = !area || area === 'all' || c.location === area;
                return matchType && matchFuel && matchSeats && matchModel && matchBrand && matchCategory && matchArea;
            }));
            return;
        }

        // ── Nhận string từ chip non-popup (premium, area...) ──
        if (payload === 'all') {
            setFilteredCars(cars);
        } else if (payload === 'premium') {
            setFilteredCars(cars.filter(c => c.price >= 900));
        } else {
            setFilteredCars(cars);
        }
    };

    const handleSearch = ({ location, carName }) => {
        setFilteredCars(cars.filter(c => {
            const matchLoc = !location || c.location.toLowerCase().includes(location.toLowerCase());
            const matchName = !carName || c.name.toLowerCase().includes(carName.toLowerCase());
            return matchLoc && matchName;
        }));
    };

    const handleSort = (sortValue) => {
        setFilteredCars(prev => {
            const sorted = [...prev];
            if (sortValue === 'price_asc') {
                sorted.sort((a, b) => a.price - b.price);
            } else if (sortValue === 'price_desc') {
                sorted.sort((a, b) => b.price - a.price);
            }
            return sorted;
        });
    };

    return (
        <main>
            <SearchBar onSearch={handleSearch} />

            <FilterBar onFilter={handleFilter} onSort={handleSort} />
            <CarGrid
                cars={filteredCars}
                loading={loading}
            />
        </main>
    );
};

export default Home;
