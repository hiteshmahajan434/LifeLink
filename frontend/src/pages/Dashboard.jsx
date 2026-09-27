import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { updateAmbulanceLocation } from "../api/auth.api";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const {
    location,
    loading,
    error,
    fetchLocation,
  } = useCurrentLocation();

  const [locationUpdated, setLocationUpdated] = useState(false);

  useEffect(() => {
    const syncLocation = async () => {
      const currentLocation = await fetchLocation();

      if (!currentLocation) {
        return;
      }

      try {
        await updateAmbulanceLocation(currentLocation);
        setLocationUpdated(true);
      } catch (error) {
        console.error(
          "Failed to update ambulance location:",
          error
        );
      }
    };

    syncLocation();
  }, [fetchLocation]);

  return (
    <div>
      <header>
        <h1>LifeLink</h1>

        <div>
          <span>{user?.name || "Ambulance"}</span>

          <button onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main>
        <section>
          <h2>Ambulance Dashboard</h2>

          <p>
            Ambulance ID: {user?.id || "N/A"}
          </p>

          <p>
            Email: {user?.email || "N/A"}
          </p>

          <p>
            Mobile: {user?.mobile || "N/A"}
          </p>
        </section>

        <section>
          <h2>Current Location</h2>

          {loading && (
            <p>Getting your location...</p>
          )}

          {error && (
            <p>{error}</p>
          )}

          {location && (
            <>
              <p>
                Latitude: {location.latitude}
              </p>

              <p>
                Longitude: {location.longitude}
              </p>
            </>
          )}

          {locationUpdated && (
            <p>
              ✓ Location synced with server
            </p>
          )}
        </section>

        <section>
          <h2>Map</h2>

          <div
            style={{
              height: "400px",
              border: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>
              Map will be integrated here
            </p>
          </div>
        </section>

        <section>
          <h2>Nearby Hospitals</h2>

          <p>
            Nearby hospitals will appear here.
          </p>
        </section>

        <section>
          <h2>Emergency</h2>

          <button>
            Create Emergency Request
          </button>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;