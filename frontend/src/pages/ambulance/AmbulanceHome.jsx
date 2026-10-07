import { useState } from "react";

import useAmbulanceLocation from "../../hooks/useAmbulanceLocation";
import useDrivingRoute from "../../hooks/useDrivingRoute";

import PageHero from "../../components/layout/PageHero";
import EmergencyRequestPanel from "../../components/emergency/EmergencyRequestPanel";
import MapCard from "../../components/map/MapCard";

import { toLatLng } from "../../utils/geo";

const AmbulanceHome = () => {
  const { location, hospitals, error } =
    useAmbulanceLocation();

  const [routeHospital, setRouteHospital] =
    useState(null);

  /*
   * Resolve the assigned hospital against the
   * nearby hospitals list.
   *
   * Socket.IO may give us only partial hospital
   * information, so prefer the complete object
   * from the hospitals list when available.
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
   * Assigned hospital becomes the route destination.
   */
  const assignedPoint =
    resolvedRouteHospital && location
      ? toLatLng(resolvedRouteHospital)
      : null;

  /*
   * Calculate the driving route ONCE here.
   *
   * This route becomes the single source of truth
   * for both:
   *
   * 1. MapCard
   * 2. SearchingRequest
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
    <>
      <PageHero
        title="Emergency Map"
        subtitle="Real-time ambulance dispatch & live hospital routing"
      />

      <div className="grid h-[calc(100dvh-140px)] min-h-0 grid-cols-1 gap-6 px-6 pb-8 lg:px-8 xl:grid-cols-[420px_minmax(0,1fr)]">

        <EmergencyRequestPanel
          location={location}
          hospitals={hospitals}
          route={route}
          onRouteChange={setRouteHospital}
        />

        <MapCard
          location={location}
          hospitals={hospitals}
          routeHospital={routeHospital}
          route={route}
          routeLoading={routeLoading}
          routeError={routeError}
          error={error}
        />

      </div>
    </>
  );
};

export default AmbulanceHome;