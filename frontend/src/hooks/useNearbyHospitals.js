import { useCallback, useState } from "react";
import { getNearbyHospitals } from "../api/hospital.api";

export const useNearbyHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNearbyHospitals = useCallback(
    async ({ latitude, longitude, radius = 10000 }) => {
      setLoading(true);
      setError("");

      try {
        const response = await getNearbyHospitals({
          latitude,
          longitude,
          radius,
        });

        if (response.success) {
          setHospitals(response.data || []);
        } else {
          setHospitals([]);
        }

        return response.data || [];
      } catch (error) {
        console.error("Failed to fetch nearby hospitals:", error);

        setError(
          error.response?.data?.message ||
            "Unable to fetch nearby hospitals."
        );

        setHospitals([]);

        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    hospitals,
    loading,
    error,
    fetchNearbyHospitals,
  };
};