import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix default Leaflet marker icons with Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const MapCenter = ({ latitude, longitude }) => {
  const map = useMap();

  useEffect(() => {
    if (latitude == null || longitude == null) {
      return;
    }

    map.setView([latitude, longitude], 14);
  }, [latitude, longitude, map]);

  return null;
};

const EmergencyMap = ({ ambulanceLocation, hospitals }) => {
  if (
    !ambulanceLocation?.latitude ||
    !ambulanceLocation?.longitude
  ) {
    return (
      <div
        style={{
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Waiting for ambulance location...</p>
      </div>
    );
  }

  const ambulanceLatitude = ambulanceLocation.latitude;
  const ambulanceLongitude = ambulanceLocation.longitude;

  return (
    <MapContainer
      center={[ambulanceLatitude, ambulanceLongitude]}
      zoom={14}
      style={{
        height: "500px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapCenter
        latitude={ambulanceLatitude}
        longitude={ambulanceLongitude}
      />

      {/* Ambulance */}
      <Marker
        position={[
          ambulanceLatitude,
          ambulanceLongitude,
        ]}
      >
        <Popup>
          <strong>Your Ambulance</strong>
          <br />
          Current location
        </Popup>
      </Marker>

      {/* Hospitals */}
      {hospitals.map((hospital) => {
        const coordinates =
          hospital.location?.coordinates;

        if (
          !coordinates ||
          coordinates.length !== 2
        ) {
          return null;
        }

        const [longitude, latitude] = coordinates;

        return (
          <Marker
            key={hospital._id}
            position={[latitude, longitude]}
          >
            <Popup>
              <strong>{hospital.name}</strong>

              <br />

              {hospital.hospitalId && (
                <>
                  ID: {hospital.hospitalId}
                  <br />
                </>
              )}

              {hospital.address && (
                <>
                  {hospital.address}
                  <br />
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default EmergencyMap;