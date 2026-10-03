import {
  Hospital,
  Navigation,
} from "lucide-react";

import LiveMap from "./LiveMap";

import { Badge } from "../ui";

import {
  toLatLng,
} from "../../utils/geo";

import useDrivingRoute from "../../hooks/useDrivingRoute";

export default function MapCard({
  location,
  hospitals = [],
  routeHospital,
  error,
}) {
  /*
   * The assignment event may contain only
   * partial hospital information.
   *
   * Resolve it against the nearby hospital
   * list when possible.
   */
  const resolvedRouteHospital = routeHospital
    ? hospitals.find(
      (hospital) =>
        String(hospital._id) ===
        String(routeHospital._id) ||
        String(hospital.id) ===
        String(routeHospital.id)
    ) || routeHospital
    : null;

  /*
   * Assigned hospital becomes the route
   * destination.
   */
  const assignedPoint =
    resolvedRouteHospital && location
      ? toLatLng(resolvedRouteHospital)
      : null;

  /*
   * Calculate the actual road route.
   */
  const {
    route,
    loading: routeLoading,
    error: routeError,
  } = useDrivingRoute(
    location,
    assignedPoint
  );


  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-card border border-line bg-card shadow-card">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/30" />

          <h2 className="text-body font-semibold text-ink">
            Live Dispatch Map
          </h2>

          <span className="hidden font-mono text-label text-ink-muted sm:inline">
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
      <div className="relative min-h-[420px] flex-1">

        <LiveMap
          ambulance={location}
          hospitals={hospitals}
          routeTarget={assignedPoint}
          routeCoordinates={
            route?.coordinates || []
          }
        />

        {/* Location error */}
        {error && (
          <div className="absolute left-4 top-4 z-[500] max-w-xs rounded-field border border-critical/30 bg-card px-3.5 py-2.5 text-caption font-medium text-critical shadow-float">
            {error}
          </div>
        )}

        {/* Routing error */}
        {routeError && (
          <div className="absolute left-4 top-4 z-[500] max-w-xs rounded-field border border-critical/30 bg-card px-3.5 py-2.5 text-caption font-medium text-critical shadow-float">
            {routeError}
          </div>
        )}

        {/* Route loading */}
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

            <div>
              <p className="text-body font-semibold text-ink">
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