import {
  useEffect,
  useRef,
  useState,
} from "react";
import { getDrivingRoute } from "../api/routing.api";

const RECALCULATE_DISTANCE_METERS = 75;

const toRadians = (value) =>
  (value * Math.PI) / 180;

const distanceMeters = (a, b) => {
  const earthRadius = 6371000;

  const dLat = toRadians(
    b.latitude - a.latitude
  );

  const dLon = toRadians(
    b.longitude - a.longitude
  );

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 *
      Math.cos(lat1) *
      Math.cos(lat2);

  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x)
    )
  );
};

const samePoint = (a, b) => {
  if (!a || !b) return false;

  return (
    a.latitude === b.latitude &&
    a.longitude === b.longitude
  );
};

export default function useDrivingRoute(
  ambulance,
  destination
) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  const lastRouteStart = useRef(null);
  const lastRouteDestination = useRef(null);

  const requestId = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    if (!ambulance || !destination) {
      setRoute(null);
      setError("");
      setLoading(false);

      lastRouteStart.current = null;
      lastRouteDestination.current = null;

      return () => {
        mounted.current = false;
      };
    }

    const destinationChanged =
      !samePoint(
        lastRouteDestination.current,
        destination
      );

    const movedEnough =
      !lastRouteStart.current ||
      distanceMeters(
        lastRouteStart.current,
        ambulance
      ) >= RECALCULATE_DISTANCE_METERS;

    /*
     * Recalculate when:
     * 1. There is no previous route.
     * 2. Ambulance moved at least 75 metres.
     * 3. Assigned destination changed.
     */
    if (!movedEnough && !destinationChanged) {
      return () => {
        mounted.current = false;
      };
    }

    const currentRequestId =
      ++requestId.current;

    /*
     * Save the starting point BEFORE making
     * the request.
     *
     * This prevents duplicate requests when
     * React re-runs the effect in development.
     */
    lastRouteStart.current = {
      latitude: ambulance.latitude,
      longitude: ambulance.longitude,
    };

    lastRouteDestination.current = {
      latitude: destination.latitude,
      longitude: destination.longitude,
    };

    /*
     * If the destination changed, remove the
     * previous route while the new one loads.
     */
    if (destinationChanged) {
      setRoute(null);
    }

    setLoading(true);
    setError("");

    const calculateRoute = async () => {
      try {
        const newRoute =
          await getDrivingRoute({
            start: ambulance,
            destination,
          });

        /*
         * Ignore responses from older requests.
         */
        if (
          !mounted.current ||
          currentRequestId !==
            requestId.current
        ) {
          return;
        }

        setRoute(newRoute);
      } catch (error) {
        if (
          !mounted.current ||
          currentRequestId !==
            requestId.current
        ) {
          return;
        }

        /*
         * Allow the next GPS update to retry
         * if this route request failed.
         */
        lastRouteStart.current = null;

        setError(
          error.message ||
            "Unable to calculate driving route."
        );
      } finally {
        if (
          mounted.current &&
          currentRequestId ===
            requestId.current
        ) {
          setLoading(false);
        }
      }
    };

    calculateRoute();

    return () => {
      mounted.current = false;
    };
  }, [ambulance, destination]);

  return {
    route,
    loading,
    error,
  };
}