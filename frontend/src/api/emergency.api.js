import api from "./axios";

export const createEmergencyRequest = async (data) => {
  const response = await api.post("/emergency", data);
  return response.data;
};

export const updateEmergencyRequest = async (id, data) => {
  const response = await api.put(`/emergency/${id}`, data);
  return response.data;
};

export const cancelEmergencyRequest = async (id) => {
  const response = await api.delete(`/emergency/${id}`);
  return response.data;
};

export const confirmEmergencyRequest = async (id) => {
  const response = await api.post(`/emergency/${id}/confirm`);
  return response.data;
};