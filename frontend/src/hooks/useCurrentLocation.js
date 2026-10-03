import { useCallback, useState } from "react";
import {
  getCurrentLocation,
  watchCurrentLocation,
} from "../utils/location";

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

  const startWatchingLocation = useCallback(() => {
    setLoading(true);
    setError("");

    const stopWatching = watchCurrentLocation(
      (currentLocation) => {
        setLocation(currentLocation);
        setLoading(false);
      },
      (error) => {
        console.error("Location watch error:", error);

        setError(
          "Unable to access your location. Please allow location permission."
        );

        setLoading(false);
      }
    );

    return stopWatching;
  }, []);

  return {
    location,
    loading,
    error,
    fetchLocation,
    startWatchingLocation,
  };
};