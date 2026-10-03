const OSRM_BASE_URL =
  "https://router.project-osrm.org/route/v1/driving";

const ROUTE_TIMEOUT_MS = 10000;

export const getDrivingRoute = async ({
  start,
  destination,
}) => {
  const url =
    `${OSRM_BASE_URL}/` +
    `${start.longitude},${start.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson`;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, ROUTE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Route service failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !data.routes?.length
    ) {
      throw new Error(
        "No driving route found."
      );
    }

    const route = data.routes[0];

    if (
      !route.geometry?.coordinates?.length
    ) {
      throw new Error(
        "Route geometry is unavailable."
      );
    }

    return {
      coordinates:
        route.geometry.coordinates.map(
          ([longitude, latitude]) => [
            latitude,
            longitude,
          ]
        ),

      distanceMeters: route.distance,

      durationSeconds: route.duration,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Route request timed out."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};