import {
  Hospital,
  Navigation,
} from "lucide-react";

import LiveMap from "./LiveMap";

import { Badge } from "../ui";

import {
  toLatLng,
} from "../../utils/geo";

export default function MapCard({
  location,
  hospitals = [],
  routeHospital,
  route,
  routeLoading,
  routeError,
  error,
  isRequestCollapsed = false,
}) {
  const resolvedRouteHospital = routeHospital
    ? hospitals.find(
        (hospital) =>
          String(hospital._id) ===
            String(routeHospital._id) ||
          String(hospital.id) ===
            String(routeHospital.id)
      ) || routeHospital
    : null;

  const assignedPoint =
    resolvedRouteHospital && location
      ? toLatLng(resolvedRouteHospital)
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-line bg-card shadow-card">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/30" />

          <h2 className="truncate text-body font-semibold text-ink">
            Live Dispatch Map
          </h2>

          <span className="hidden shrink-0 font-mono text-label text-ink-muted sm:inline">
            {location
              ? "• GPS active"
              : "• Waiting for GPS"}
          </span>
        </div>

        <Badge tone="primary">
          <Hospital size={12} />
          Hospitals ({hospitals.length})
        </Badge>
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1">
        <LiveMap
          ambulance={location}
          hospitals={hospitals}
          routeTarget={assignedPoint}
          routeCoordinates={
            route?.coordinates || []
          }
          isRequestCollapsed={
            isRequestCollapsed
          }
        />

        {error && (
          <div className="absolute left-4 top-4 z-[500] max-w-xs rounded-field border border-critical/30 bg-card px-3.5 py-2.5 text-caption font-medium text-critical shadow-float">
            {error}
          </div>
        )}

        {routeError && (
          <div className="absolute left-4 top-4 z-[500] max-w-xs rounded-field border border-critical/30 bg-card px-3.5 py-2.5 text-caption font-medium text-critical shadow-float">
            {routeError}
          </div>
        )}

        {routeLoading && (
          <div className="absolute right-4 top-4 z-[500] rounded-field border border-line bg-card px-3 py-2 text-caption font-medium text-ink-muted shadow-card">
            {route
              ? "Updating route..."
              : "Calculating route..."}
          </div>
        )}

        {assignedPoint && route && (
          <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-3 rounded-card border border-line bg-card/95 p-3.5 shadow-float backdrop-blur">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-field bg-primary-soft text-primary-strong">
              <Navigation size={18} />
            </span>

            <div className="min-w-0">
              <p className="truncate text-body font-semibold text-ink">
                {resolvedRouteHospital?.name}
              </p>

              <p className="text-caption text-ink-muted">
                {(route.distanceMeters / 1000).toFixed(1)} km
                {" · "}
                about{" "}
                {Math.max(
                  1,
                  Math.ceil(
                    route.durationSeconds / 60
                  )
                )}{" "}
                min away
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
