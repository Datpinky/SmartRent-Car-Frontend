import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

import CarMarker from './CarMarker';
import UserLocation from './UserLocation';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  LOCATIONIQ_API_KEY,
  RADIUS_OPTIONS,
  TILE_ATTRIBUTION,
  TILE_URL,
} from './mapConfig';
import { enrichCarsWithDistance, filterByRadius } from './mapUtils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const FlyToUser = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 14, { duration: 1.4 });
    }
  }, [map, position]);

  return null;
};

const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return '';
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
};

const formatPrice = (car) => {
  if (!car?.price) return '';
  const unitLabel = car.chargeUnit === 'day' ? '/ngay' : `/${car.chargeUnit || 'ngay'}`;
  return `${Number(car.price).toLocaleString('vi-VN')} ${car.currency || 'VND'}${unitLabel}`;
};

const normalizeInitialUserLocation = (value) => {
  if (!value) return null;

  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

const MapView = ({
  cars = [],
  height = '600px',
  initialUserLocation = null,
  userLocationTitle = 'Vi tri cua ban',
  userLocationSubtitle = '',
}) => {
  const [userLocation, setUserLocation] = useState(() => normalizeInitialUserLocation(initialUserLocation));
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(!initialUserLocation);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [radiusKm, setRadiusKm] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const normalizedInitialLocation = normalizeInitialUserLocation(initialUserLocation);

    if (normalizedInitialLocation) {
      setUserLocation(normalizedInitialLocation);
      setLocationError(null);
      setLocationLoading(false);
      return undefined;
    }

    if (!navigator.geolocation) {
      setLocationError('Trinh duyet cua ban khong ho tro dinh vi.');
      setLocationLoading(false);
      return undefined;
    }

    setLocationLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? 'Vui long cho phep truy cap vi tri.'
            : 'Khong the xac dinh vi tri cua ban.'
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [initialUserLocation]);

  const carsWithDistance = useMemo(
    () => enrichCarsWithDistance(cars, userLocation),
    [cars, userLocation]
  );

  const visibleCars = useMemo(
    () => (radiusKm !== null ? filterByRadius(carsWithDistance, radiusKm) : carsWithDistance),
    [carsWithDistance, radiusKm]
  );

  const sortedCars = useMemo(
    () => [...visibleCars].sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }),
    [visibleCars]
  );

  const selectedCar = useMemo(
    () => sortedCars.find((car) => car.id === selectedCarId) || null,
    [selectedCarId, sortedCars]
  );

  const handleCarSelect = useCallback((car) => {
    setSelectedCarId(car.id);
  }, []);

  const handleRadiusChange = (value) => {
    setRadiusKm(value === 'all' ? null : Number(value));
  };

  const isApiKeyMissing = LOCATIONIQ_API_KEY.startsWith('pk.your_');
  const usingSavedLocation = Boolean(normalizeInitialUserLocation(initialUserLocation));

  return (
    <div className="mapview-root">
      <div className="mapview-controls">
        <div className="mapview-location-status">
          {locationLoading ? (
            <span className="mapview-status mapview-status--loading">
              <span className="mapview-spinner" />
              Dang xac dinh vi tri...
            </span>
          ) : locationError ? (
            <span className="mapview-status mapview-status--error">
              {locationError}
            </span>
          ) : (
            <span className="mapview-status mapview-status--ok">
              {usingSavedLocation ? 'Dang dung dia chi da luu trong ho so' : 'Da xac dinh vi tri cua ban'}
            </span>
          )}
        </div>

        <div className="mapview-radius-wrap">
          <label className="mapview-radius-label" htmlFor="radius-select">
            Ban kinh:
          </label>
          <select
            id="radius-select"
            className="mapview-radius-select"
            value={radiusKm ?? 'all'}
            onChange={(event) => handleRadiusChange(event.target.value)}
          >
            <option value="all">Tat ca</option>
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
        </div>

        <div className="mapview-count-badge">
          {visibleCars.length} xe{radiusKm !== null ? ` trong ${radiusKm} km` : ''}
        </div>

        <button
          className="mapview-sidebar-toggle"
          onClick={() => setShowSidebar((value) => !value)}
          title={showSidebar ? 'An danh sach' : 'Hien danh sach'}
        >
          {showSidebar ? 'An danh sach' : 'Mo danh sach'}
        </button>
      </div>

      {isApiKeyMissing && (
        <div className="mapview-api-warn">
          Chua cau hinh API key LocationIQ trong `src/components/Map/mapConfig.js`.
        </div>
      )}

      <div className="mapview-body">
        <div className="mapview-map-wrap" style={{ height }}>
          <MapContainer
            center={userLocation ? [userLocation.lat, userLocation.lng] : DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ width: '100%', height: '100%' }}
            zoomControl
          >
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
            <FlyToUser position={userLocation} />
            <UserLocation
              position={userLocation}
              radiusKm={radiusKm}
              title={userLocationTitle}
              subtitle={userLocationSubtitle}
            />

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

        {showSidebar && (
          <aside className="mapview-sidebar">
            <p className="mapview-sidebar-title">
              Xe tren ban do
              <span className="mapview-sidebar-count">{sortedCars.length}</span>
            </p>

            {selectedCar && (
              <div className="mapview-selected-summary">
                <div className="mapview-selected-title">{selectedCar.name}</div>
                <div className="mapview-selected-sub">
                  {[selectedCar.plateNumber, selectedCar.statusLabel].filter(Boolean).join(' - ')}
                </div>
              </div>
            )}

            {sortedCars.length === 0 ? (
              <div className="mapview-sidebar-empty">
                <span style={{ fontSize: '2rem' }}>Xe</span>
                <p>Khong tim thay xe trong khu vuc hien tai.</p>
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
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setSelectedCarId(car.id);
                      }
                    }}
                  >
                    {car.image ? (
                      <img src={car.image} alt={car.name} className="mapview-car-thumb" />
                    ) : (
                      <div className="mapview-car-thumb-placeholder">Xe</div>
                    )}

                    <div className="mapview-car-info">
                      <p className="mapview-car-name">{car.name}</p>
                      <p className="mapview-car-meta">
                        {[car.plateNumber, car.category].filter(Boolean).join(' - ')}
                      </p>
                      <p className="mapview-car-meta">
                        {[car.seats ? `${car.seats} cho` : '', car.fuel].filter(Boolean).join(' - ')}
                      </p>
                      {car.address && <p className="mapview-car-address">{car.address}</p>}
                      {car.distance !== null && <p className="mapview-car-dist">{formatDistance(car.distance)} tu ban</p>}
                    </div>

                    {formatPrice(car) && <div className="mapview-car-price">{formatPrice(car)}</div>}
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
