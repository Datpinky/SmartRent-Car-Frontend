import React, { useEffect, useMemo, useState } from 'react';
import MapView from '../../../components/Map/MapView';
import vehicleService from '../../../services/vehicleService';
import './MapPage.css';

const isMapEligibleVehicle = (vehicle) =>
  vehicle
  && vehicle.active !== false
  && vehicle.status === 'available';

const mapVehicleToMapCar = (vehicle) => {
  const latitude = Number(vehicle?.latitude ?? vehicle?.lat);
  const longitude = Number(vehicle?.longitude ?? vehicle?.lng);
  const address = vehicle?.address || vehicle?.pickupAddress || vehicle?.location || '';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !address) {
    return null;
  }

  return {
    id: vehicle._id || vehicle.id,
    name: vehicle.name,
    latitude,
    longitude,
    price: vehicle.price,
    currency: vehicle.currency || 'VND',
    chargeUnit: vehicle.chargeUnit || 'day',
    seats: vehicle.seats,
    fuel: vehicle.fuel,
    category: vehicle.category || vehicle.type,
    image: vehicle.image || '',
    address,
    status: vehicle.status,
    statusLabel: vehicle.statusLabel,
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    verified: vehicle.verified || null,
  };
};

const MapPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMapCars = async () => {
      setLoading(true);
      try {
        const { data: vehicleList } = await vehicleService.getList({ limit: 100 });
        const mappedCars = (vehicleList || [])
          .filter(isMapEligibleVehicle)
          .map(mapVehicleToMapCar)
          .filter(Boolean);

        if (!cancelled) {
          setCars(mappedCars);
          setError(
            mappedCars.length === 0
              ? 'Khong co xe nao co du lieu dia chi va toa do hop le de hien thi tren map.'
              : ''
          );
        }
      } catch (err) {
        if (!cancelled) {
          setCars([]);
          setError(err.message || 'Khong the tai du lieu ban do tu backend.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMapCars();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: cars.length,
      verified: cars.filter((car) => Boolean(car.verified)).length,
      withAddress: cars.filter((car) => Boolean(car.address)).length,
    }),
    [cars]
  );

  return (
    <div className="map-page">
      <div className="map-page-header">
        <div className="map-page-header-left">
          <h1 className="map-page-title">
            <span className="map-page-title-icon">Map</span>
            Ban do xe cho thue
          </h1>
          <p className="map-page-subtitle">
            Chi dung du lieu vehicle co san tu backend, khong goi them user_location hay route auth-only khac.
          </p>
        </div>

        <div className="map-page-header-badges">
          <span className="map-badge map-badge--green">
            {loading ? 'Dang tai...' : `${stats.total} xe`}
          </span>
          <span className="map-badge map-badge--blue">
            {loading ? '...' : `${stats.verified} da xac minh`}
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#c2410c',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: '0.84rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="map-page-map-container">
        {loading ? (
          <div
            style={{
              minHeight: 620,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              borderRadius: 20,
              color: '#6b7280',
            }}
          >
            Dang tai du lieu vehicle tu backend...
          </div>
        ) : (
          <MapView cars={cars} height="620px" />
        )}
      </div>

      <div className="map-tips">
        <div className="map-tip-item">
          <span className="map-tip-icon">1</span>
          <span>Chi hien thi xe `active`, `status = available`, co day du address, latitude va longitude trong payload vehicle.</span>
        </div>
        <div className="map-tip-item">
          <span className="map-tip-icon">2</span>
          <span>Trang nay khong goi `user_location` va khong dung route vehicle location auth-only de tranh lech contract.</span>
        </div>
        <div className="map-tip-item">
          <span className="map-tip-icon">3</span>
          <span>{stats.withAddress} xe hien co dia chi hop le tren map.</span>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
