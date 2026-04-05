/**
 * MapPage.jsx – full-page wrapper for the Map feature
 * Route: /map  (public, no auth required)
 *
 * Provides sample car data so the feature works standalone.
 * In production, replace `SAMPLE_CARS` with an API call.
 */

import React from 'react';
import MapView from '../../../components/Map/MapView';
import './MapPage.css';

// ── Sample car data ────────────────────────────────────────────────────────────
// Replace with real API data as needed.
const SAMPLE_CARS = [
  {
    id: 1,
    name: 'Toyota Camry 2.5Q 2023',
    latitude: 21.0278,
    longitude: 105.8342,
    price: 1200000,
    seats: 5,
    fuel: 'Xăng',
    category: 'Sedan',
    image: null,
  },
  {
    id: 2,
    name: 'Hyundai Tucson 2.0 AT',
    latitude: 21.0350,
    longitude: 105.8450,
    price: 950000,
    seats: 5,
    fuel: 'Xăng',
    category: 'SUV',
    image: null,
  },
  {
    id: 3,
    name: 'Kia Morning 2022',
    latitude: 21.0200,
    longitude: 105.8250,
    price: 550000,
    seats: 4,
    fuel: 'Xăng',
    category: 'Hatchback',
    image: null,
  },
  {
    id: 4,
    name: 'VinFast VF8 Plus 2023',
    latitude: 21.0410,
    longitude: 105.8220,
    price: 1350000,
    seats: 7,
    fuel: 'Điện',
    category: 'SUV',
    image: null,
  },
  {
    id: 5,
    name: 'Honda CR-V 1.5L Turbo',
    latitude: 21.0155,
    longitude: 105.8500,
    price: 1100000,
    seats: 7,
    fuel: 'Xăng',
    category: 'SUV',
    image: null,
  },
  {
    id: 6,
    name: 'Mitsubishi Xpander 1.5 AT',
    latitude: 21.0490,
    longitude: 105.8390,
    price: 800000,
    seats: 7,
    fuel: 'Xăng',
    category: 'MPV',
    image: null,
  },
  {
    id: 7,
    name: 'Ford Ranger Wildtrak 2.0',
    latitude: 21.0060,
    longitude: 105.8600,
    price: 1050000,
    seats: 5,
    fuel: 'Dầu',
    category: 'Bán tải',
    image: null,
  },
  {
    id: 8,
    name: 'Mazda 3 1.5L Sport',
    latitude: 21.0580,
    longitude: 105.8150,
    price: 750000,
    seats: 5,
    fuel: 'Xăng',
    category: 'Sedan',
    image: null,
  },
];

const MapPage = () => {
  return (
    <div className="map-page">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="map-page-header">
        <div className="map-page-header-left">
          <h1 className="map-page-title">
            <span className="map-page-title-icon">🗺️</span>
            Bản đồ xe cho thuê
          </h1>
          <p className="map-page-subtitle">
            Tìm xe gần vị trí của bạn, lọc theo bán kính và đặt xe ngay.
          </p>
        </div>

        <div className="map-page-header-badges">
          <span className="map-badge map-badge--sky">
            🚗 {SAMPLE_CARS.length} xe khả dụng
          </span>
          <span className="map-badge map-badge--blue">📡 Thời gian thực</span>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="map-page-map-container">
        <MapView cars={SAMPLE_CARS} height="620px" />
      </div>

      {/* ── Tips ────────────────────────────────────────────────────────── */}
      <div className="map-tips">
        <div className="map-tip-item">
          <span className="map-tip-icon">📍</span>
          <span>Cho phép ứng dụng truy cập vị trí để xem xe gần bạn</span>
        </div>
        <div className="map-tip-item">
          <span className="map-tip-icon">🔍</span>
          <span>Dùng bộ lọc bán kính để thu hẹp kết quả</span>
        </div>
        <div className="map-tip-item">
          <span className="map-tip-icon">🚗</span>
          <span>Nhấn vào marker để xem thông tin và đặt xe</span>
        </div>
      </div>
    </div>
  );
};

export default MapPage;