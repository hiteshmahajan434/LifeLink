import { useState } from "react";
import useAmbulanceLocation from "../../hooks/useAmbulanceLocation";
import PageHero from "../../components/layout/PageHero";
import EmergencyRequestPanel from "../../components/emergency/EmergencyRequestPanel";
import MapCard from "../../components/map/MapCard";

const AmbulanceHome = () => {
  const { location, hospitals, error } =
    useAmbulanceLocation();

  const [routeHospital, setRouteHospital] =
    useState(null);

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
          onRouteChange={setRouteHospital}
        />

        <MapCard
          location={location}
          hospitals={hospitals}
          routeHospital={routeHospital}
          error={error}
        />
      </div>
    </>
  );
};

export default AmbulanceHome;