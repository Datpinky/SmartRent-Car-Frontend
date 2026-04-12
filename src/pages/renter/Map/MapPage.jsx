import React, { useEffect, useMemo, useState } from 'react';
import MapView from '../../../components/Map/MapView';
import vehicleLocationService from '../../../services/vehicleLocationService';
import vehicleService from '../../../services/vehicleService';
import './MapPage.css';

const isMapEligibleVehicle = (vehicle) => vehicle && vehicle.active !== false && vehicle.status === 'available';

const mapVehicleToMapCar = (vehicle, location) => {
  const latitude = Number(location?.latitude ?? vehicle?.latitude);
  const longitude = Number(location?.longitude ?? vehicle?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
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
    category: vehicle.category,
    image: vehicle.image || '',
    address: location?.address || vehicle.address || '',
    plusCode: location?.plusCode || '',
    status: vehicle.status,
    statusLabel: vehicle.statusLabel,
    plateNumber: vehicle.plateNumber || '',
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    maxDistance: vehicle.maxDistance || '',
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
        const token = localStorage.getItem('smartrent_token');
        if (!token) {
          if (!cancelled) {
            setCars([]);
            setError('Dang nhap renter de tai du lieu VehicleLocation tu backend.');
            setLoading(false);
          }
          return;
        }

        const { data: vehicleList } = await vehicleService.getList({ limit: 100 });
        const vehicles = (vehicleList || []).filter(isMapEligibleVehicle);

        const locationResults = await vehicleLocationService.getManyByVehicleIds(
          vehicles.map((vehicle) => vehicle._id || vehicle.id)
        );

        const locationMap = new Map(
          locationResults.map((item) => [String(item.vehicleId), item.data])
        );

        const mappedCars = vehicles
          .map((vehicle) => mapVehicleToMapCar(
            vehicle,
            locationMap.get(String(vehicle._id || vehicle.id))
          ))
          .filter(Boolean);

        if (!cancelled) {
          setCars(mappedCars);
          setError(
            mappedCars.length === 0
              ? 'Khong co xe nao co du lieu VehicleLocation hop le de hien thi tren map.'
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
            Ghep du lieu tu bang Vehicle va VehicleLocation, hien thi bang Leaflet va tile cua LocationIQ.
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
            Dang tai du lieu Vehicle va VehicleLocation...
          </div>
        ) : (
          <MapView cars={cars} height="620px" />
        )}
      </div>

      <div className="map-tips">
        <div className="map-tip-item">
          <span className="map-tip-icon">1</span>
          <span>Chi hien thi xe `active` va `status = available` co day du `latitude` va `longitude`.</span>
        </div>
        <div className="map-tip-item">
          <span className="map-tip-icon">2</span>
          <span>Popup va sidebar doc truc tiep bien so, gia, dia chi va trang thai tu 2 bang Vehicle + VehicleLocation.</span>
        </div>
        <div className="map-tip-item">
          <span className="map-tip-icon">3</span>
          <span>{stats.withAddress} xe hien co dia chi chi tiet tu VehicleLocation.</span>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
