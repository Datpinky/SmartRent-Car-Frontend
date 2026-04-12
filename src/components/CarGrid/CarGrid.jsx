import React, { useState, useEffect } from 'react';
import CarCard from '../CarCard/CarCard';
import { MdDirectionsCar } from 'react-icons/md';

const shimmerClass = "bg-gradient-to-r from-[#f0f0f0] via-[#e0e0e0] to-[#f0f0f0] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]";

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
    <div className={`w-full ${shimmerClass}`} style={{ aspectRatio: '16/10' }} />
    <div className="p-3.5 flex flex-col gap-2.5">
      <div className={`h-3 rounded-md w-[70%] ${shimmerClass}`} />
      <div className={`h-3 rounded-md w-[45%] ${shimmerClass}`} />
      <div className={`h-3 rounded-md w-[55%] ${shimmerClass}`} />
      <div className={`h-5 rounded-md w-[80%] ${shimmerClass}`} />
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
    <section className="max-w-[1280px] mx-auto px-5 pt-7 pb-[60px]">
      <div className="grid grid-cols-4 gap-5 max-[1100px]:grid-cols-3 max-[768px]:grid-cols-2 max-[768px]:gap-3.5 max-[480px]:grid-cols-1">
        {loading
          ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : visible.length > 0
            ? visible.map(car => <CarCard key={car.id} car={car} />)
            : (
              <div className="col-span-full text-center py-[60px] px-5">
                <div className="text-[4rem] mb-4 opacity-40 flex justify-center">
                  <MdDirectionsCar />
                </div>
                <h3 className="text-[1.1rem] text-gray-600 mb-2">Không tìm thấy xe phù hợp</h3>
                <p className="text-[0.85rem] text-gray-400">Hãy thử thay đổi bộ lọc hoặc địa điểm tìm kiếm</p>
              </div>
            )
        }
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-primary rounded-full text-[0.9rem] font-semibold text-primary bg-transparent transition-all hover:bg-primary hover:text-white hover:shadow-[0_4px_16px_rgba(0,177,79,0.3)] hover:-translate-y-px"
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
