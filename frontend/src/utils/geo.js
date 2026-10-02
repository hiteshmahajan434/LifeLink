// Straight-line distance between two lat/lng points, in km (haversine)
export const distanceKm = (lat1, lng1, lat2, lng2) => {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};

// Rough ambulance ETA at an average 40 km/h
export const etaMinutes = (km) => Math.max(1, Math.round((km / 40) * 60));

// GeoJSON stores [lng, lat]; the UI wants { latitude, longitude }
export const toLatLng = (place) => {
  const c = place?.location?.coordinates;
  return Array.isArray(c) && c.length === 2 ? { latitude: c[1], longitude: c[0] } : null;
};
