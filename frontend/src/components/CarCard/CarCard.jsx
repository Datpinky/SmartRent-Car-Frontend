import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaMapMarkerAlt, FaGasPump, FaStore } from 'react-icons/fa';
import { MdPeople, MdSettings, MdDirectionsCar } from 'react-icons/md';
import { BsLightningChargeFill } from 'react-icons/bs';
import './CarCard.css';

// Color gradient background based on car color
const CarColorBg = ({ color, name }) => {
    const hue = Math.abs(
        name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    ) % 360;

    return (
        <div
            className="car-image-color"
            style={{
                background: `linear-gradient(135deg, hsl(${hue},30%,88%) 0%, hsl(${hue},20%,95%) 100%)`,
            }}
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

const StarRating = ({ rating }) => {
    return (
        <div className="car-rating-stars">
            {[1, 2, 3, 4, 5].map(i => (
                <FaStar key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
            ))}
        </div>
    );
};

const CarCard = ({ car }) => {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);

    const handleLike = (e) => {
        e.stopPropagation();
        setLiked(!liked);
    };

    const handleClick = () => {
        navigate(`/xe/${car.id}`);
    };

    const isOwner = car.type === 'Gặp chủ xe';
    const fuelIcon = car.fuel === 'Điện'
        ? <BsLightningChargeFill style={{ color: '#2196f3' }} />
        : <FaGasPump style={{ color: '#f59e0b' }} />;

    return (
        <article className="car-card" onClick={handleClick}>
            {/* Image */}
            <div className="car-image-wrap">
                {car.image
                    ? <img src={car.image} alt={car.name} loading="lazy" />
                    : <CarColorBg color={car.color} name={car.name} />
                }
                <div className="car-image-overlay" />

                {/* Favorite */}
                <button className={`car-favorite ${liked ? 'liked' : ''}`} onClick={handleLike} aria-label="Yêu thích">
                    {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                </button>

                {/* Type badge */}
                <span className={`car-type-badge ${isOwner ? 'owner' : ''}`}>
                    <MdDirectionsCar size={12} />
                    {car.type}
                </span>
            </div>

            {/* Body */}
            <div className="car-card-body">
                <h3 className="car-name">{car.name}</h3>

                {car.showroom && (
                    <div className="car-showroom">
                        <FaStore size={10} />
                        {car.showroom}
                    </div>
                )}

                <div className="car-location">
                    <FaMapMarkerAlt size={11} />
                    {car.location}
                </div>


                {/* Rating */}
                <div className="car-rating">
                    <StarRating rating={car.rating} />
                    <span className="car-rating-score">{car.rating}</span>
                    <span className="car-rating-trips">({car.trips} chuyến)</span>
                </div>

                {/* Price */}
                <div className="car-price-row">
                    <span className="car-price">{car.price.toLocaleString()}K</span>
                    <span className="car-price-unit">/ngày</span>
                </div>

                <div className="car-duration">2 ngày 4 giờ</div>
                <div className="car-vat-note">Giá tạm tính chưa bao gồm VAT</div>

                {/* Specs */}
                <div className="car-specs">
                    <div className="car-spec">
                        <MdPeople size={18} />
                        <span>{car.seats} chỗ</span>
                    </div>
                    <div className="car-spec">
                        <MdSettings size={18} />
                        <span>{car.transmission === 'Số tự động' ? 'Số tự động' : 'Số sàn'}</span>
                    </div>
                    <div className="car-spec">
                        {fuelIcon}
                        <span>{car.fuel}</span>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default CarCard;
