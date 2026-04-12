export const LOCATIONIQ_API_KEY = 'pk.ad7f3a1c34b60bf9ea1390d5e66edb1d';

export const TILE_URL = `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_API_KEY}`;

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://locationiq.com" target="_blank" rel="noreferrer">LocationIQ</a> | ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

export const DEFAULT_CENTER = [10.7769, 106.7009];
export const DEFAULT_ZOOM = 13;
export const RADIUS_OPTIONS = [1, 3, 5, 10, 20, 50];
