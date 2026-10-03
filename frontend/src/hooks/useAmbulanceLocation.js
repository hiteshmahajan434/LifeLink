import { useEffect } from "react";
import { updateAmbulanceLocation } from "../api/ambulance.api";
import { useCurrentLocation } from "./useCurrentLocation";
import { useNearbyHospitals } from "./useNearbyHospitals";

export default function useAmbulanceLocation() {
  const {
    location,
    error,
    startWatchingLocation,
  } = useCurrentLocation();

  const {
    hospitals,
    fetchNearbyHospitals,
  } = useNearbyHospitals();

  useEffect(() => {
    const stopWatching = startWatchingLocation();

    return () => {
      stopWatching();
    };
  }, [startWatchingLocation]);

  useEffect(() => {
    if (!location) return;

    // Persist location through REST.
    updateAmbulanceLocation(location).catch((err) =>
      console.error(
        "Unable to update ambulance location:",
        err
      )
    );

    // Load nearby hospitals.
    fetchNearbyHospitals({
      ...location,
      radius: 10000,
    });
  }, [location, fetchNearbyHospitals]);

  return {
    location,
    hospitals,
    error,
  };
}