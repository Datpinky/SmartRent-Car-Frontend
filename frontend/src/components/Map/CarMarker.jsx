/**
 * CarMarker.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A single car marker on the Leaflet map.
 * Uses a custom DivIcon – no default-icon bug possible.
 *
 * Props
 * ─────
 * car: {
 *   id        : number | string
 *   name      : string
 *   latitude  : number
 *   longitude : number
 *   image?    : string          URL for car thumbnail
 *   price?    : string | number daily rental price (VND)
 *   seats?    : number
 *   fuel?     : string
 *   category? : string
 *   distance? : number | null   pre-computed km distance (optional)
 * }
 * isSelected      : boolean   – enlarge/highlight this marker
 * onClick         : (car) => void
 */

import React, { useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// ─── Icon factory ────────────────────────────────────────────────────────────
const makeCarIcon = (isSelected) =>
  L.divIcon({
    html: `
      <div class="car-marker-icon ${isSelected ? 'car-marker-icon--selected' : ''}">
        <span class="car-marker-emoji">🚗</span>
      </div>
    `,
    className: '',
    iconSize: isSelected ? [44, 44] : [36, 36],
    iconAnchor: isSelected ? [22, 44] : [18, 36],
    popupAnchor: [0, -38],
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
  if (!price) return null;
  return Number(price).toLocaleString('vi-VN') + ' ₫/ngày';
};

const formatDistance = (km) => {
  if (km === null || km === undefined) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

// ─── Component ───────────────────────────────────────────────────────────────
const CarMarker = ({ car, isSelected = false, onClick }) => {
  const markerRef = useRef(null);

  const handleClick = () => {
    onClick?.(car);
    markerRef.current?.openPopup();
  };

  const icon = makeCarIcon(isSelected);

  return (
    <Marker
      ref={markerRef}
      position={[car.latitude, car.longitude]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
      zIndexOffset={isSelected ? 500 : 0}
    >
      <Popup className="map-popup car-popup" minWidth={220}>
        <div className="car-popup-inner">
          {/* Header */}
          <div className="car-popup-header">
            {car.image ? (
              <img src={car.image} alt={car.name} className="car-popup-img" />
            ) : (
              <div className="car-popup-img-placeholder">🚗</div>
            )}
            <div className="car-popup-header-info">
              <p className="car-popup-name">{car.name}</p>
              {car.category && (
                <span className="car-popup-badge">{car.category}</span>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="car-popup-details">
            {car.seats && (
              <div className="car-popup-detail-item">
                <span>🪑</span>
                <span>{car.seats} chỗ</span>
              </div>
            )}
            {car.fuel && (
              <div className="car-popup-detail-item">
                <span>⛽</span>
                <span>{car.fuel}</span>
              </div>
            )}
            {formatDistance(car.distance) && (
              <div className="car-popup-detail-item car-popup-distance">
                <span>📍</span>
                <span>{formatDistance(car.distance)} từ bạn</span>
              </div>
            )}
          </div>

          {/* Price + CTA */}
          <div className="car-popup-footer">
            {formatPrice(car.price) && (
              <span className="car-popup-price">{formatPrice(car.price)}</span>
            )}
            <a
              href={`/xe/${car.id}`}
              className="car-popup-btn"
              target="_blank"
              rel="noreferrer"
            >
              Xem xe
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default CarMarker;
