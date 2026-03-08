import React, { useState, useEffect } from 'react';
import CarCard from '../CarCard/CarCard';
import { MdDirectionsCar } from 'react-icons/md';
import './CarGrid.css';

const SkeletonCard = () => (
    <div className="car-skeleton">
        <div className="skeleton-img" />
        <div className="skeleton-body">
            <div className="skeleton-line" style={{ width: '70%' }} />
            <div className="skeleton-line" style={{ width: '45%' }} />
            <div className="skeleton-line" style={{ width: '55%' }} />
            <div className="skeleton-line" style={{ width: '80%', height: 20 }} />
        </div>
    </div>
);

const CarGrid = ({ cars, loading = false, title = 'Xe tự lái' }) => {
    const [visibleCount, setVisibleCount] = useState(8);
    const [displayCars, setDisplayCars] = useState([]);

    useEffect(() => {
        setDisplayCars(cars || []);
    }, [cars]);

    const visible = displayCars.slice(0, visibleCount);
    const hasMore = displayCars.length > visibleCount;

    return (
        <section className="car-grid-section">
            <div className="car-grid">
                {loading
                    ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : visible.length > 0
                        ? visible.map(car => <CarCard key={car.id} car={car} />)
                        : (
                            <div className="car-grid-empty">
                                <div className="car-grid-empty-icon">
                                    <MdDirectionsCar />
                                </div>
                                <h3>Không tìm thấy xe phù hợp</h3>
                                <p>Hãy thử thay đổi bộ lọc hoặc địa điểm tìm kiếm</p>
                            </div>
                        )
                }
            </div>

            {hasMore && (
                <div className="car-grid-view-more">
                    <button
                        className="btn-view-more"
                        onClick={() => setVisibleCount(v => v + 8)}
                    >
                        Xem thêm xe
                        <span>↓</span>
                    </button>
                </div>
            )}
        </section>
    );
};

export default CarGrid;
