import {
  useEffect,
  useRef,
} from "react";

import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import {
  Minus,
  Plus,
  LocateFixed,
} from "lucide-react";

import ambulanceImage from "../../assets/map/ambulance.png";
import hospitalImage from "../../assets/map/hospital.png";

const ambulanceIcon = L.icon({
    iconUrl: ambulanceImage,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23],
});

const hospitalIcon = L.icon({
    iconUrl: hospitalImage,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23],
});

const FALLBACK_CENTER = [
  18.5204,
  73.8567,
];

/**
 * Frames the map initially and when the
 * assigned hospital changes.
 *
 * It deliberately does not recenter the
 * map whenever the ambulance GPS changes.
 */
function FitToPoints({
  ambulance,
  target,
}) {
  const map = useMap();

  const hasInitialFit =
    useRef(false);

  const previousTarget =
    useRef(null);

  useEffect(() => {
    if (!ambulance) {
      return;
    }

    const targetChanged =
      target &&
      (
        !previousTarget.current ||
        previousTarget.current.latitude !==
          target.latitude ||
        previousTarget.current.longitude !==
          target.longitude
      );

    /*
     * Fit the map:
     * - when GPS becomes available for
     *   the first time
     * - when the assigned hospital changes
     */
    if (
      !hasInitialFit.current ||
      targetChanged
    ) {
      const points = [
        [
          ambulance.latitude,
          ambulance.longitude,
        ],
      ];

      if (target) {
        points.push([
          target.latitude,
          target.longitude,
        ]);
      }

      if (points.length > 1) {
        map.fitBounds(points, {
          paddingTopLeft: [70, 70],
          paddingBottomRight: [70, 130],
          maxZoom: 15,
        });
      } else {
        map.setView(
          points[0],
          13
        );
      }

      hasInitialFit.current = true;

      if (target) {
        previousTarget.current = {
          latitude: target.latitude,
          longitude: target.longitude,
        };
      }
    }
  }, [ambulance, target, map]);

  return null;
}

export default function LiveMap({
  ambulance,
  hospitals = [],
  routeTarget,
  routeCoordinates = [],
}) {
  const mapRef = useRef(null);

  const zoomBtn =
    "grid h-9 w-9 place-items-center rounded-field border border-line bg-card text-ink shadow-card hover:bg-card-muted";

  return (
    <div className="absolute inset-0">

      <MapContainer
        ref={mapRef}
        center={FALLBACK_CENTER}
        zoom={15}
        zoomControl={false}
        className="h-full w-full"
      >

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToPoints
          ambulance={ambulance}
          target={routeTarget}
        />

        {/* Ambulance */}
        {ambulance && (
          <Marker
            position={[
              ambulance.latitude,
              ambulance.longitude,
            ]}
            icon={ambulanceIcon}
          />
        )}

        {/* Hospitals */}
        {hospitals.map((hospital) => {
          const [
            longitude,
            latitude,
          ] =
            hospital.location
              ?.coordinates || [];

          if (
            latitude == null ||
            longitude == null
          ) {
            return null;
          }

          return (
            <Marker
              key={
                hospital._id ||
                hospital.id
              }
              position={[
                latitude,
                longitude,
              ]}
              icon={hospitalIcon}
            />
          );
        })}

        {/* Road route casing */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#FFFFFF",
              weight: 9,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Road route */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#232224",
              weight: 5,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

      </MapContainer>

      {/* Map controls */}
      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">

        <button
          aria-label="Zoom in"
          className={zoomBtn}
          onClick={() =>
            mapRef.current?.zoomIn()
          }
        >
          <Plus size={16} />
        </button>

        <button
          aria-label="Zoom out"
          className={zoomBtn}
          onClick={() =>
            mapRef.current?.zoomOut()
          }
        >
          <Minus size={16} />
        </button>

        {ambulance && (
          <button
            aria-label="Center on my location"
            className={zoomBtn}
            onClick={() =>
              mapRef.current?.setView(
                [
                  ambulance.latitude,
                  ambulance.longitude,
                ],
                14
              )
            }
          >
            <LocateFixed size={16} />
          </button>
        )}

      </div>
    </div>
  );
}