import { Hospital, Navigation } from "lucide-react";
import LiveMap from "./LiveMap";
import { Badge } from "../ui";
import { distanceKm, etaMinutes, toLatLng } from "../../utils/geo";

/**
 * "Live Dispatch Map" card: header, the map, and a footer with route info.
 * routeHospital (assigned) wins; otherwise we show the nearest hospital.
 */
export default function MapCard({ location, hospitals, routeHospital, error }) {
  const nearest = location
    ? [...hospitals]
        .map((h) => ({ hospital: h, point: toLatLng(h) }))
        .filter((x) => x.point)
        .map((x) => ({ ...x, km: distanceKm(location.latitude, location.longitude, x.point.latitude, x.point.longitude) }))
        .sort((a, b) => a.km - b.km)[0]
    : null;

  const assignedPoint = routeHospital && location ? toLatLng(routeHospital) : null;
  const focus = assignedPoint
    ? { hospital: routeHospital, point: assignedPoint, km: distanceKm(location.latitude, location.longitude, assignedPoint.latitude, assignedPoint.longitude) }
    : nearest;

  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/30" />
          <h2 className="text-body font-semibold text-ink">Live Dispatch Map</h2>
          <span className="hidden font-mono text-label text-ink-muted sm:inline">
            {location ? "• GPS active" : "• Waiting for GPS"}
          </span>
        </div>
        <Badge tone="primary"><Hospital size={12} /> Hospitals ({hospitals.length})</Badge>
      </div>

      <div className="relative min-h-[420px] flex-1">
        <LiveMap ambulance={location} hospitals={hospitals} routeTarget={assignedPoint} />

        {error && (
          <div className="absolute left-4 top-4 z-[500] max-w-xs rounded-field border border-critical/30 bg-card px-3.5 py-2.5 text-caption font-medium text-critical shadow-float">
            {error}
          </div>
        )}

        {focus && (
          <div className="absolute bottom-4 left-4 right-4 z-[500] flex items-center gap-3 rounded-card border border-line bg-card/95 p-3.5 shadow-float backdrop-blur sm:right-auto sm:max-w-md">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-field bg-primary-soft text-primary-strong">
              <Navigation size={18} />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-body font-semibold text-ink">
                <span className="truncate">{routeHospital ? "Route to " : "Nearest: "}{focus.hospital.name}</span>
                <Badge tone={routeHospital ? "primary" : "neutral"}>{routeHospital ? "Assigned" : "Nearest"}</Badge>
              </p>
              <p className="text-caption text-ink-muted">
                {focus.km.toFixed(1)} km · about {etaMinutes(focus.km)} min away
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
