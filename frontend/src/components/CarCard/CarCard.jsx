import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaMapMarkerAlt, FaGasPump, FaStore } from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';

const CarColorBg = ({ color, name }) => {
  const hue = Math.abs(
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % 360;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)` }}
    >
      <MdDirectionsCar
        style={{
          fontSize: '5rem',
          color: color || `hsl(${hue},40%,50%)`,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  );
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-px text-[0.8rem]">
    {[1, 2, 3, 4, 5].map(i => (
      <FaStar key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
    ))}
  </div>
);

const CarCard = ({ car }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  const handleLike = (e) => { e.stopPropagation(); setLiked(!liked); };
  const handleClick = () => { navigate(`/xe/${car.id}`); };

  const isOwner = car.type === 'Gặp chủ xe';
  const fuelIcon = car.fuel === 'Điện'
    ? <BsLightningChargeFill style={{ color: '#2196f3' }} />
    : <FaGasPump style={{ color: '#f59e0b' }} />;

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-[250ms] cursor-pointer border border-gray-100 flex flex-col group hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] hover:-translate-y-1 hover:border-gray-200"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '16/10' }}>
        {car.image
          ? <img src={car.image} alt={car.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-105" />
          : <CarColorBg color={car.color} name={car.name} />
        }
        <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* Favorite */}
        <button
          className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-transform z-[2] hover:scale-110 ${liked ? 'text-red-500' : 'text-gray-400'}`}
          onClick={handleLike}
          aria-label="Yêu thích"
        >
          {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
        </button>

        {/* Type badge */}
        <span
          className={`absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2.5 py-[5px] rounded-full text-[0.7rem] font-medium text-white backdrop-blur-sm border border-white/15 z-[2]
            ${isOwner ? 'bg-purple-800/85' : 'bg-black/65'}`}
        >
          <MdDirectionsCar size={12} />
          {car.type}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 flex-1 flex flex-col gap-1.5">
        <h3 className="text-base font-bold text-gray-900 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">{car.name}</h3>

        {car.showroom && (
          <div className="flex items-center gap-1 text-[0.72rem] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
            <FaStore size={10} />
            {car.showroom}
          </div>
        )}

        <div className="text-[0.78rem] text-primary font-medium">
          {car.address}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <StarRating rating={car.rating} />
          <span className="text-[0.8rem] font-bold text-gray-800">{car.rating}</span>
          <span className="text-[0.75rem] text-gray-500">({car.trips} chuyến)</span>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[1.2rem] font-extrabold text-primary">{car.price.toLocaleString()}K</span>
          <span className="text-[0.8rem] font-medium text-gray-500">/ngày</span>
        </div>
        <div className="text-[0.75rem] text-gray-500 -mt-0.5">2 ngày 4 giờ</div>
        <div className="text-[0.68rem] text-primary italic -mt-0.5">Giá tạm tính chưa bao gồm VAT</div>

        {/* Specs */}
        <div className="flex items-center border-t border-gray-100 mt-2 pt-2.5">
          {[
            { icon: <MdPeople size={18} />, label: `${car.seats} chỗ` },
            { icon: <MdSettings size={18} />, label: car.transmission === 'Số tự động' ? 'Số tự động' : 'Số sàn' },
            { icon: fuelIcon, label: car.fuel },
          ].map(({ icon, label }, i, arr) => (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center gap-[3px] text-[0.72rem] text-gray-500 font-medium text-center [&>svg]:text-primary
                ${i < arr.length - 1 ? 'border-r border-gray-100' : ''}`}
            >
              <span className="text-primary">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

export default CarCard;
