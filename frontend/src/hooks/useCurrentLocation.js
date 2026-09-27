import { useCallback, useState } from "react";
import { getCurrentLocation } from "../utils/location";

export const useCurrentLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentLocation = await getCurrentLocation();

      setLocation(currentLocation);

      return currentLocation;
    } catch (error) {
      console.error("Location error:", error);

      setError(
        "Unable to access your location. Please allow location permission."
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    loading,
    error,
    fetchLocation,
  };
};