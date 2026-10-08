import { useState } from "react";

import {
  ChevronRight,
} from "lucide-react";

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

  const [isRequestCollapsed, setIsRequestCollapsed] =
    useState(false);

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

      <div className="h-[calc(100dvh-140px)] min-h-0 px-6 pb-8 lg:px-8">
        <div className="flex h-full min-h-0 gap-6">

          {/* Request panel */}
          <div
            className="
              relative
              hidden
              min-h-0
              shrink-0
              xl:block
              overflow-hidden
              rounded-card
              transition-[width]
              duration-[400ms]
              ease-[cubic-bezier(0.4,0,0.2,1)]
            "
            style={{
              width: isRequestCollapsed
                ? "76px"
                : "420px",
            }}
          >

            {/* Actual request card */}
            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[420px]
                transition-transform
                duration-[400ms]
                ease-[cubic-bezier(0.4,0,0.2,1)]
              "
              style={{
                transform: isRequestCollapsed
                  ? "translateX(-440px)"
                  : "translateX(0)",
              }}
            >
              <EmergencyRequestPanel
                location={location}
                hospitals={hospitals}
                route={route}
                onRouteChange={
                  setRouteHospital
                }
                onCollapse={() =>
                  setIsRequestCollapsed(true)
                }
              />
            </div>

            {/* Collapsed stripe */}
            <div
              className="
                absolute
                inset-y-0
                left-0
                w-[76px]
                overflow-hidden
                rounded-card
                border
                border-line
                bg-card
                shadow-card
                transition-opacity
                duration-200
              "
              style={{
                opacity: isRequestCollapsed
                  ? 1
                  : 0,
                pointerEvents:
                  isRequestCollapsed
                    ? "auto"
                    : "none",
              }}
            >
              {/* Expand button at top */}
              <button
                type="button"
                aria-label="Expand emergency request panel"
                onClick={() =>
                  setIsRequestCollapsed(false)
                }
                className="
                  grid
                  h-16
                  w-full
                  place-items-center
                  border-b
                  border-line
                  bg-card
                  text-ink-muted
                  transition-colors
                  hover:bg-card-muted
                  hover:text-ink
                  active:scale-[0.98]
                "
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="min-h-0 min-w-0 flex-1">
            <MapCard
              location={location}
              hospitals={hospitals}
              routeHospital={routeHospital}
              route={route}
              routeLoading={routeLoading}
              routeError={routeError}
              error={error}
              isRequestCollapsed={
                isRequestCollapsed
              }
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default AmbulanceHome;
