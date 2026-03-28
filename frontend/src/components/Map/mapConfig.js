/**
 * Map Configuration
 * ─────────────────────────────────────────────
 * Replace LOCATIONIQ_API_KEY with your real key
 * from https://locationiq.com/
 */

export const LOCATIONIQ_API_KEY = 'pk.ad7f3a1c34b60bf9ea1390d5e66edb1d';

export const TILE_URL = `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_API_KEY}`;

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://locationiq.com" target="_blank">LocationIQ</a> | ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

/** Default centre (Hanoi) – used when geolocation is unavailable */
export const DEFAULT_CENTER = [21.0278, 105.8342];
export const DEFAULT_ZOOM = 13;

/** Radius filter options (km) */
export const RADIUS_OPTIONS = [1, 3, 5, 10, 20, 50];
