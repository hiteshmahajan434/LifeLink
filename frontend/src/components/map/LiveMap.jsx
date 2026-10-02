import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Minus, Plus, LocateFixed } from "lucide-react";

/* Map pins are plain HTML styled with theme classes (no hex codes needed). */
const ambulanceIcon = L.divIcon({
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div class="grid h-9 w-9 place-items-center rounded-full border-[3px] border-ink bg-primary shadow-float">
           <div class="h-2.5 w-2.5 rounded-full bg-ink"></div></div>`,
});

const hospitalIcon = L.divIcon({
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div class="grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-accent-strong bg-accent-soft shadow-card">
           <div class="h-2.5 w-2.5 rounded-sm bg-accent-strong"></div></div>`,
});

const FALLBACK_CENTER = [18.5204, 73.8567];

/** Keeps the map framed on the ambulance (and route target, when there is one). */
function FitToPoints({ ambulance, target }) {
  const map = useMap();
  useEffect(() => {
    if (!ambulance) return;
    const points = [[ambulance.latitude, ambulance.longitude]];
    if (target) points.push([target.latitude, target.longitude]);
    // extra bottom padding keeps both pins clear of the route card
    if (points.length > 1) map.fitBounds(points, { paddingTopLeft: [70, 70], paddingBottomRight: [70, 130], maxZoom: 15 });
    else map.setView(points[0], 13);
  }, [ambulance, target, map]);
  return null;
}

/**
 * Presentational map: it receives data, it doesn't fetch any.
 *   ambulance   { latitude, longitude } | null
 *   hospitals   backend hospital docs (GeoJSON location)
 *   routeTarget { latitude, longitude } | null  → draws a dashed line ambulance → target
 */
export default function LiveMap({ ambulance, hospitals = [], routeTarget }) {
  const mapRef = useRef(null);
  const zoomBtn = "grid h-9 w-9 place-items-center rounded-field border border-line bg-card text-ink shadow-card hover:bg-card-muted";

  return (
    <div className="absolute inset-0">
      <MapContainer ref={mapRef} center={FALLBACK_CENTER} zoom={13} zoomControl={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPoints ambulance={ambulance} target={routeTarget} />

        {ambulance && <Marker position={[ambulance.latitude, ambulance.longitude]} icon={ambulanceIcon} />}

        {hospitals.map((h) => {
          const [lng, lat] = h.location?.coordinates || [];
          if (lat == null || lng == null) return null;
          return <Marker key={h._id || h.id} position={[lat, lng]} icon={hospitalIcon} />;
        })}

        {ambulance && routeTarget && (
          <Polyline
            positions={[[ambulance.latitude, ambulance.longitude], [routeTarget.latitude, routeTarget.longitude]]}
            className="stroke-ink" /* className must be a direct prop: Leaflet reads it only when the line is created */
            pathOptions={{ weight: 4, dashArray: "8 8" }}
          />
        )}
      </MapContainer>

      {/* Zoom controls (Leaflet's own are hidden in index.css) */}
      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
        <button aria-label="Zoom in" className={zoomBtn} onClick={() => mapRef.current?.zoomIn()}><Plus size={16} /></button>
        <button aria-label="Zoom out" className={zoomBtn} onClick={() => mapRef.current?.zoomOut()}><Minus size={16} /></button>
        {ambulance && (
          <button aria-label="Center on my location" className={zoomBtn}
            onClick={() => mapRef.current?.setView([ambulance.latitude, ambulance.longitude], 14)}>
            <LocateFixed size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
