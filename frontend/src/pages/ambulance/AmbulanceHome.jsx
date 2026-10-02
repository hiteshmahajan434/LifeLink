import { useState } from "react";
import useAmbulanceLocation from "../../hooks/useAmbulanceLocation";
import PageHero from "../../components/layout/PageHero";
import EmergencyRequestPanel from "../../components/emergency/EmergencyRequestPanel";
import MapCard from "../../components/map/MapCard";

/** Emergency Map: request panel on the left, live map on the right. */
const AmbulanceHome = () => {
  const { location, hospitals, error } = useAmbulanceLocation();
  const [routeHospital, setRouteHospital] = useState(null); // set once a hospital is assigned

  return (
    <>
      <PageHero title="Emergency Map" subtitle="Real-time ambulance dispatch & live hospital routing" />

      <div className="grid grid-cols-1 gap-6 px-6 pb-8 lg:px-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <EmergencyRequestPanel location={location} hospitals={hospitals} onRouteChange={setRouteHospital} />
        <MapCard location={location} hospitals={hospitals} routeHospital={routeHospital} error={error} />
      </div>
    </>
  );
};

export default AmbulanceHome;
