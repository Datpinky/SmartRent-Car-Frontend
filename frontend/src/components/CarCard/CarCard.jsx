import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsLightningChargeFill } from 'react-icons/bs';
import { FaGasPump, FaHeart, FaMapMarkerAlt, FaRegHeart, FaStar, FaStore } from 'react-icons/fa';
import { MdDirectionsCar, MdPeople, MdSettings } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import favoriteService from '../../services/favoriteService';
import { buildRentalWindowQuery, sanitizeRentalWindow } from '../../utils/rentalWindow';

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatPrice = (price, currency = 'VND') => {
  const numericPrice = Number(price || 0);
  if (!numericPrice) {
    return 'Lien he';
  }

  if (currency === 'VND') {
    return `${numericPrice.toLocaleString('vi-VN')}d`;
  }

  return `${numericPrice.toLocaleString('en-US')} ${currency}`;
};

const formatChargeUnit = (unit) => {
  if (unit === 'day') {
    return '/ngay';
  }
  if (unit === 'hour') {
    return '/gio';
  }
  return unit ? `/${unit}` : '';
};

const CarColorBg = ({ color, name }) => {
  const hue = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;

  return (
    <div
      className="flex h-full w-full items-center justify-center"
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
    {[1, 2, 3, 4, 5].map((index) => (
      <FaStar key={index} style={{ color: index <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
    ))}
  </div>
);

const CarCard = ({ car, rentalSearch = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const carId = car.id || car._id;
  const imageUrl = useMemo(() => car.image || (Array.isArray(car.images) ? car.images[0] : ''), [car.image, car.images]);
  const locationText = car.address || car.pickupAddress || car.location || '';
  const hasReviewData = Number(car.rating || 0) > 0 || Number(car.trips || 0) > 0;
  const fuelIcon = normalizeText(car.fuel) === 'dien'
    ? <BsLightningChargeFill style={{ color: '#2196f3' }} />
    : <FaGasPump style={{ color: '#f59e0b' }} />;
  const rentalWindow = sanitizeRentalWindow(rentalSearch?.pickupDate, rentalSearch?.returnDate);

  const handleLike = async (event) => {
    event.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isMongoId(carId)) {
      setLiked((current) => !current);
      return;
    }

    setLikeLoading(true);
    try {
      const result = await favoriteService.toggle(carId);
      setLiked(result.favorited);
    } catch {
      setLiked((current) => !current);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-[250ms] hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
      onClick={() => navigate(`/xe/${carId}${buildRentalWindowQuery(rentalWindow.pickupDate, rentalWindow.returnDate)}`, {
        state: {
          rentalSearch: rentalWindow,
        },
      })}
    >
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '16/10' }}>
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={car.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[400ms] group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <CarColorBg color={car.color} name={car.name} />
        )}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-black/30 to-transparent" />

        <button
          type="button"
          className={`absolute right-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-transform hover:scale-110 ${
            liked ? 'text-red-500' : 'text-gray-400'
          } ${likeLoading ? 'cursor-wait opacity-50' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
          aria-label="Yeu thich"
        >
          {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
        </button>

        {(car.category || car.type) && (
          <span className="absolute bottom-2.5 right-2.5 z-[2] flex items-center gap-1 rounded-full border border-white/15 bg-black/65 px-2.5 py-[5px] text-[0.7rem] font-medium text-white backdrop-blur-sm">
            <MdDirectionsCar size={12} />
            {car.category || car.type}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3.5">
        <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-snug text-gray-900">
          {car.name}
        </h3>

        {car.showroom && (
          <div className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] text-gray-500">
            <FaStore size={10} />
            {car.showroom}
          </div>
        )}

        {locationText && (
          <div
            className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] font-medium text-primary"
            title={locationText}
          >
            <FaMapMarkerAlt size={11} />
            {locationText}
          </div>
        )}

        {hasReviewData ? (
          <div className="mt-0.5 flex items-center gap-1.5">
            <StarRating rating={Number(car.rating || 0)} />
            <span className="text-[0.8rem] font-bold text-gray-800">{Number(car.rating || 0).toFixed(1)}</span>
            <span className="text-[0.75rem] text-gray-500">({Number(car.trips || 0)} chuyen)</span>
          </div>
        ) : (
          <div className="mt-0.5 text-[0.78rem] text-gray-400">Chua co danh gia</div>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[1.1rem] font-extrabold text-primary">{formatPrice(car.price, car.currency)}</span>
          <span className="text-[0.8rem] font-medium text-gray-500">{formatChargeUnit(car.chargeUnit)}</span>
        </div>

        <div className="mt-2 flex items-center border-t border-gray-100 pt-2.5">
          {[
            { icon: <MdPeople size={18} />, label: `${car.seats || 0} cho` },
            { icon: <MdSettings size={18} />, label: car.transmission || 'Dang cap nhat' },
            { icon: fuelIcon, label: car.fuel || 'Dang cap nhat' },
          ].map(({ icon, label }, index, all) => (
            <div
              key={`${label}-${index}`}
              className={`flex flex-1 flex-col items-center gap-[3px] text-center text-[0.72rem] font-medium text-gray-500 ${
                index < all.length - 1 ? 'border-r border-gray-100' : ''
              }`}
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
