import api from "./axios";

// =========================
// LOGIN
// =========================

export const login = async (role, credentials) => {
  const endpoint =
    role === "ambulance"
      ? "/ambulance/login"
      : "/hospital/login";

  const response = await api.post(
    endpoint,
    credentials
  );

  return response.data;
};

// =========================
// REGISTER
// =========================

export const register = async (role, data) => {
  const endpoint =
    role === "ambulance"
      ? "/ambulance/register"
      : "/hospital/register";

  const response = await api.post(
    endpoint,
    data
  );

  return response.data;
};