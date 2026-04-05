/**
 * CarLocationMap.jsx
 *
 * Props
 * ─────
 * locationText : string   – human-readable address (used when lat/lng not provided)
 * lat?         : number   – direct latitude from backend vehicle_location API
 * lng?         : number   – direct longitude from backend vehicle_location API
 * carName?     : string   – car name for popup
 * city?        : string   – city appended to geocoding query fallback
 *
 * When lat+lng are provided, geocoding is skipped entirely (faster, no API quota used).
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CarLocationMap.css';

// ─── Fix Leaflet default-icon bug (import once globally is fine, but safe here) ─
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ─── Config ──────────────────────────────────────────────────────────────────
const LOCATIONIQ_KEY = 'pk.ad7f3a1c34b60bf9ea1390d5e66edb1d';
const TILE_URL = `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_KEY}`;
const TILE_ATTR =
  '&copy; <a href="https://locationiq.com">LocationIQ</a> | ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// ─── Simple red dot icon ─────────────────────────────────────────────────────
const redDotIcon = L.divIcon({
  html: `<div class="clm-red-dot"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ─── Helper: fly map to resolved latlng ──────────────────────────────────────
const FlyTo = ({ latlng }) => {
  const map = useMap();
  useEffect(() => {
    if (latlng) map.flyTo(latlng, 16, { duration: 1.2 });
  }, [latlng, map]);
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CarLocationMap = ({
  locationText,
  lat,
  lng,
  city = 'TP. Hồ Chí Minh, Việt Nam',
}) => {
  const [latlng, setLatlng] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapsSearchText = city?.trim() ? `${locationText}, ${city}` : locationText;

  useEffect(() => {
    // If backend provided direct coordinates, use them — skip geocoding
    if (lat && lng) {
      setLatlng([parseFloat(lat), parseFloat(lng)]);
      setAddress(locationText || '');
      setLoading(false);
      return;
    }

    if (!locationText) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const query = encodeURIComponent(mapsSearchText);
    const url = `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${query}&format=json&limit=1&accept-language=vi`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Lỗi API: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data || data.length === 0) throw new Error('Không tìm thấy vị trí');
        const { lat: resLat, lon, display_name } = data[0];
        setLatlng([parseFloat(resLat), parseFloat(lon)]);
        setAddress(display_name);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [locationText, city, mapsSearchText, lat, lng]);

  const googleMapsUrl = latlng
    ? `https://www.google.com/maps?q=${latlng[0]},${latlng[1]}`
    : `https://www.google.com/maps/search/${encodeURIComponent(mapsSearchText)}`;

  return (
    <div className="clm-root">
      {/* Address bar */}
      <div className="clm-address-bar">
        <span className="clm-address-icon">📍</span>
        <span className="clm-address-text">
          {loading ? 'Đang tải vị trí…' : error ? locationText : (address || locationText)}
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="clm-open-maps-btn"
        >
          Mở trong Maps ↗
        </a>
      </div>

      {/* Map area */}
      <div className="clm-map-wrap">
        {loading && (
          <div className="clm-overlay">
            <div className="clm-spinner" />
            <p className="clm-overlay-text">Đang tải bản đồ…</p>
          </div>
        )}

        {error && (
          <div className="clm-overlay clm-overlay--error">
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <p className="clm-overlay-text">Không thể tải bản đồ</p>
            <p className="clm-overlay-sub">{error}</p>
          </div>
        )}

        {/* Map always mounts so it initialises; content is driven by latlng */}
        {!error && (
          <MapContainer
            center={latlng || [10.7769, 106.7009]}   // fallback: HCM City centre
            zoom={latlng ? 16 : 12}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            scrollWheelZoom={false}
          >
            <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

            {latlng && (
              <>
                <FlyTo latlng={latlng} />
                <Marker position={latlng} icon={redDotIcon} />
              </>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default CarLocationMap;
