import api from "./axios";

export const loginAmbulance = async (credentials) => {
  const response = await api.post("/ambulance/login", credentials);
  return response.data;
};

export const registerAmbulance = async (ambulanceData) => {
  const response = await api.post("/ambulance/register", ambulanceData);
  return response.data;
};

export const getAmbulanceProfile = async () => {
  const response = await api.get("/ambulance/me");
  return response.data;
};

export const updateAmbulanceProfile = async (data) => {
  const response = await api.patch("/ambulance/profile", data);
  return response.data;
};

export const changeAmbulancePassword = async (data) => {
  const response = await api.get("/ambulance/change-password", data);
  return response.data;
};

export const updateAmbulanceLocation = async ({
  latitude,
  longitude,
}) => {
  const response = await api.patch("/ambulance/location", {
    latitude,
    longitude,
  });

  return response.data;
};