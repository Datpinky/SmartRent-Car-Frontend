/**
 * UserLocation.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a pulsing "You are here" marker at the user's current GPS position.
 * Uses a custom DivIcon so we avoid the Leaflet default-icon issue entirely.
 */

import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// ─── Custom SVG icon ────────────────────────────────────────────────────────
const userIconHtml = `
  <div class="user-location-icon">
    <div class="user-location-pulse"></div>
    <div class="user-location-dot"></div>
  </div>
`;

const userIcon = L.divIcon({
  html: userIconHtml,
  className: '',          // clear Leaflet's own wrapper class
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * @param {{ lat: number, lng: number }} position
 * @param {number | null}               radiusKm   – draws accuracy circle when set
 */
const UserLocation = ({ position, radiusKm = null }) => {
  if (!position) return null;

  return (
    <>
      {/* Accuracy / radius ring */}
      {radiusKm && (
        <Circle
          center={[position.lat, position.lng]}
          radius={radiusKm * 1000}          // Leaflet expects metres
          pathOptions={{
            color: '#00b14f',
            fillColor: '#00b14f',
            fillOpacity: 0.07,
            weight: 1.5,
            dashArray: '6 4',
          }}
        />
      )}

      <Marker
        position={[position.lat, position.lng]}
        icon={userIcon}
        zIndexOffset={1000}                 // always on top of car markers
      >
        <Popup className="map-popup user-popup">
          <div className="map-popup-inner">
            <span className="map-popup-icon">📍</span>
            <div>
              <p className="map-popup-title">Vị trí của bạn</p>
              <p className="map-popup-sub">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </p>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default UserLocation;
