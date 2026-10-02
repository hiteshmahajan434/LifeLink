import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { updateAmbulanceLocation } from "../api/ambulance.api";
import { useNearbyHospitals } from "../hooks/useNearbyHospitals";
import EmergencyMap from "../components/map/EmergencyMap";
import EmergencyCard from "../components/emergency/EmergencyCard";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const {
    location,
    loading,
    error,
    fetchLocation,
  } = useCurrentLocation();

  const {
    hospitals,
    loading: hospitalsLoading,
    error: hospitalsError,
    fetchNearbyHospitals,
  } = useNearbyHospitals();


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

        await fetchNearbyHospitals(currentLocation);
        } catch (error) {
        console.error("Location sync failed:", error);
        }
    };

    syncLocation();
    }, [fetchLocation, fetchNearbyHospitals]);

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
        <h2>Live Map</h2>

        <EmergencyMap
            ambulanceLocation={location}
            hospitals={hospitals}
        />
        </section>

        <EmergencyCard />

        <section>
        <h2>Nearby Hospitals</h2>

        {hospitalsLoading && (
            <p>Finding nearby hospitals...</p>
        )}

        {hospitalsError && (
            <p>{hospitalsError}</p>
        )}

        {!hospitalsLoading && !hospitalsError && hospitals.length === 0 && (
            <p>No hospitals found nearby.</p>
        )}

        {hospitals.map((hospital) => (
            <div key={hospital._id}>
            <h3>{hospital.name}</h3>

            <p>
                Hospital ID: {hospital.hospitalId}
            </p>

            <p>
                {hospital.address}
            </p>
            </div>
        ))}
        </section>

      </main>
    </div>
  );
};

export default Dashboard;