import { useEffect } from "react";
import { updateAmbulanceLocation } from "../api/ambulance.api";
import { useCurrentLocation } from "./useCurrentLocation";
import { useNearbyHospitals } from "./useNearbyHospitals";

/**
 * Everything the ambulance map needs, in one hook:
 *   1. read the device GPS
 *   2. save it on the backend (PATCH /ambulance/location)
 *   3. load hospitals within 10 km
 * (Same sequence the previous AmbulanceMap performed internally.)
 */
export default function useAmbulanceLocation() {
  const { location, error, fetchLocation } = useCurrentLocation();
  const { hospitals, fetchNearbyHospitals } = useNearbyHospitals();

  useEffect(() => {
    (async () => {
      const current = await fetchLocation();
      if (!current) return;
      updateAmbulanceLocation(current).catch((err) => console.error("Unable to update ambulance location:", err));
      fetchNearbyHospitals({ ...current, radius: 10000 });
    })();
  }, [fetchLocation, fetchNearbyHospitals]);

  return { location, hospitals, error };
}
