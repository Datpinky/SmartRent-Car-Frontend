/**
 * MapView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Core map component. Orchestrates:
 *   • Leaflet map initialisation (LocationIQ tiles)
 *   • Browser geolocation (UserLocation)
 *   • Car markers with distance & radius filter (CarMarker)
 *   • Map control panel (radius selector, legend, car list sidebar)
 *
 * Props
 * ─────
 * cars : Array<{
 *   id, name, latitude, longitude,
 *   image?, price?, seats?, fuel?, category?
 * }>                              – required
 * height? : string                – CSS height string, default '600px'
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

import CarMarker from './CarMarker';
import UserLocation from './UserLocation';
import {
  TILE_URL,
  TILE_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  RADIUS_OPTIONS,
  LOCATIONIQ_API_KEY,
} from './mapConfig';
import { enrichCarsWithDistance, filterByRadius } from './mapUtils';

// ─── Fix Leaflet default marker icon (must run once) ─────────────────────────
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ─── Internal: fly to user when location changes ──────────────────────────────
const FlyToUser = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 14, { duration: 1.4 });
    }
  }, [position, map]);
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MapView = ({ cars = [], height = '600px' }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [radiusKm, setRadiusKm] = useState(null);   // null = no filter
  const [showSidebar, setShowSidebar] = useState(true);

  // ── 1. Geolocation ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị.');
      setLocationLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? 'Vui lòng cho phép truy cập vị trí.'
            : 'Không thể xác định vị trí của bạn.'
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── 2. Enrich cars with distance from user ──────────────────────────────────
  const carsWithDistance = useMemo(
    () => enrichCarsWithDistance(cars, userLocation),
    [cars, userLocation]
  );

  // ── 3. Apply radius filter ──────────────────────────────────────────────────
  const visibleCars = useMemo(
    () =>
      radiusKm !== null
        ? filterByRadius(carsWithDistance, radiusKm)
        : carsWithDistance,
    [carsWithDistance, radiusKm]
  );

  // ── 4. Sort sidebar list by distance ───────────────────────────────────────
  const sortedCars = useMemo(
    () =>
      [...visibleCars].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }),
    [visibleCars]
  );

  const handleCarSelect = useCallback((car) => {
    setSelectedCarId(car.id);
  }, []);

  const handleRadiusChange = (val) => {
    setRadiusKm(val === 'all' ? null : Number(val));
  };

  const isApiKeyMissing = LOCATIONIQ_API_KEY.startsWith('pk.your_');

  return (
    <div className="mapview-root">
      {/* ── Top control bar ────────────────────────────────────────────────── */}
      <div className="mapview-controls">
        {/* Location status */}
        <div className="mapview-location-status">
          {locationLoading ? (
            <span className="mapview-status mapview-status--loading">
              <span className="mapview-spinner" />
              Đang xác định vị trí…
            </span>
          ) : locationError ? (
            <span className="mapview-status mapview-status--error">
              ⚠️ {locationError}
            </span>
          ) : (
            <span className="mapview-status mapview-status--ok">
              📍 Đã xác định vị trí
            </span>
          )}
        </div>

        {/* Radius filter */}
        <div className="mapview-radius-wrap">
          <label className="mapview-radius-label" htmlFor="radius-select">
            🔍 Bán kính:
          </label>
          <select
            id="radius-select"
            className="mapview-radius-select"
            value={radiusKm ?? 'all'}
            onChange={(e) => handleRadiusChange(e.target.value)}
          >
            <option value="all">Tất cả</option>
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </div>

        {/* Car count badge */}
        <div className="mapview-count-badge">
          🚗 {visibleCars.length} xe{radiusKm !== null ? ` trong ${radiusKm} km` : ''}
        </div>

        {/* Sidebar toggle */}
        <button
          className="mapview-sidebar-toggle"
          onClick={() => setShowSidebar((v) => !v)}
          title={showSidebar ? 'Ẩn danh sách' : 'Hiện danh sách'}
        >
          {showSidebar ? '◀ Ẩn' : '▶ Danh sách'}
        </button>
      </div>

      {/* ── API key warning ─────────────────────────────────────────────────── */}
      {isApiKeyMissing && (
        <div className="mapview-api-warn">
          ⚠️ <strong>Chưa cấu hình API key LocationIQ.</strong> Vui lòng mở{' '}
          <code>src/components/Map/mapConfig.js</code> và thay{' '}
          <code>LOCATIONIQ_API_KEY</code> bằng key thật của bạn.
          Bản đồ sẽ hiển thị lỗi 401 cho đến khi cấu hình xong.
        </div>
      )}

      {/* ── Map + Sidebar layout ────────────────────────────────────────────── */}
      <div className="mapview-body">
        {/* Map */}
        <div className="mapview-map-wrap" style={{ height }}>
          <MapContainer
            center={
              userLocation
                ? [userLocation.lat, userLocation.lng]
                : DEFAULT_CENTER
            }
            zoom={DEFAULT_ZOOM}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

            {/* Fly to user when location first resolves */}
            <FlyToUser position={userLocation} />

            {/* User marker + radius ring */}
            <UserLocation position={userLocation} radiusKm={radiusKm} />

            {/* Car markers */}
            {visibleCars.map((car) => (
              <CarMarker
                key={car.id}
                car={car}
                isSelected={selectedCarId === car.id}
                onClick={handleCarSelect}
              />
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="mapview-sidebar">
            <p className="mapview-sidebar-title">
              Xe gần bạn{' '}
              <span className="mapview-sidebar-count">{sortedCars.length}</span>
            </p>

            {sortedCars.length === 0 ? (
              <div className="mapview-sidebar-empty">
                <span style={{ fontSize: '2rem' }}>🚗</span>
                <p>Không tìm thấy xe trong bán kính này.</p>
              </div>
            ) : (
              <ul className="mapview-car-list">
                {sortedCars.map((car) => (
                  <li
                    key={car.id}
                    className={`mapview-car-item ${selectedCarId === car.id ? 'mapview-car-item--active' : ''}`}
                    onClick={() => setSelectedCarId(car.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setSelectedCarId(car.id)
                    }
                  >
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="mapview-car-thumb"
                      />
                    ) : (
                      <div className="mapview-car-thumb-placeholder">🚗</div>
                    )}

                    <div className="mapview-car-info">
                      <p className="mapview-car-name">{car.name}</p>
                      <p className="mapview-car-meta">
                        {car.seats && `${car.seats} chỗ`}
                        {car.seats && car.fuel && ' · '}
                        {car.fuel}
                      </p>
                      {car.distance !== null && (
                        <p className="mapview-car-dist">
                          📍{' '}
                          {car.distance < 1
                            ? `${Math.round(car.distance * 1000)} m`
                            : `${car.distance.toFixed(1)} km`}{' '}
                          từ bạn
                        </p>
                      )}
                    </div>

                    {car.price && (
                      <div className="mapview-car-price">
                        {Number(car.price).toLocaleString('vi-VN')}
                        <span> ₫</span>
                        <small>/ngày</small>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default MapView;
