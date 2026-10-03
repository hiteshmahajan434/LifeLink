const OSRM_BASE_URL =
  'https://router.project-osrm.org';

// --------------------------------------------------
// Check whether coordinates are valid
// --------------------------------------------------

const isValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates)) {
    return false;
  }

  if (coordinates.length !== 2) {
    return false;
  }

  const [longitude, latitude] = coordinates;

  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

// --------------------------------------------------
// Get road distances from one origin to many
// destinations using OSRM Table API
// --------------------------------------------------

export const getRoadDistances = async ({
  origin,
  destinations
}) => {
  if (!isValidCoordinates(origin)) {
    throw new Error(
      `Invalid origin coordinates: ${JSON.stringify(origin)}`
    );
  }

  if (
    !Array.isArray(destinations) ||
    destinations.length === 0
  ) {
    return [];
  }

  const invalidDestination =
    destinations.find(
      coordinates =>
        !isValidCoordinates(coordinates)
    );

  if (invalidDestination) {
    throw new Error(
      `Invalid hospital coordinates: ${JSON.stringify(
        invalidDestination
      )}`
    );
  }

  const coordinates = [
    origin,
    ...destinations
  ]
    .map(
      ([longitude, latitude]) =>
        `${longitude},${latitude}`
    )
    .join(';');

  const destinationIndexes =
    destinations
      .map((_, index) => index + 1)
      .join(';');

  const url =
    `${OSRM_BASE_URL}/table/v1/driving/` +
    `${coordinates}` +
    `?sources=0` +
    `&destinations=${destinationIndexes}` +
    `&annotations=distance,duration`;

  console.log(
    '🛣️ OSRM Table request:',
    url
  );

  const response = await fetch(url);

  const responseText =
    await response.text();

  if (!response.ok) {
    console.error(
      '❌ OSRM error:',
      response.status,
      responseText
    );

    throw new Error(
      `OSRM request failed: ${response.status} ${responseText}`
    );
  }

  const data =
    JSON.parse(responseText);

  if (data.code !== 'Ok') {
    throw new Error(
      `OSRM returned ${data.code}: ${
        data.message || 'Unknown error'
      }`
    );
  }

  if (
    !data.distances ||
    !data.durations ||
    !data.distances[0] ||
    !data.durations[0]
  ) {
    throw new Error(
      'OSRM returned invalid distance/duration data'
    );
  }

  return destinations.map(
    (_, index) => ({
      distanceKm:
        data.distances[0][index] / 1000,

      durationMinutes:
        data.durations[0][index] / 60
    })
  );
};