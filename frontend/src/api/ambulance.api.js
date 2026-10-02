import api from "./axios";

// Get logged-in ambulance profile
export const getAmbulanceProfile = async () => {
  const response = await api.get(
    "/ambulance/me"
  );

  return response.data;
};

// Update ambulance profile
export const updateAmbulanceProfile = async (
  data
) => {
  const response = await api.patch(
    "/ambulance/profile",
    data
  );

  return response.data;
};

// Change ambulance password
export const changeAmbulancePassword = async (
  data
) => {
  // Backend route is PATCH /ambulance/change-password
  const response = await api.patch(
    "/ambulance/change-password",
    data
  );

  return response.data;
};

// Update ambulance location
export const updateAmbulanceLocation = async ({
  latitude,
  longitude,
}) => {
  const response = await api.patch(
    "/ambulance/location",
    {
      latitude,
      longitude,
    }
  );

  return response.data;
};

export const getEmergencyRequests = async () => {
  const response = await api.get("/ambulance/emergency");
  return response.data;
};