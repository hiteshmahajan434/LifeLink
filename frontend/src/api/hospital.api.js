// import api from "./axios";

// // =========================
// // HOSPITAL SERVICES
// // =========================

// // Get nearby hospitals
// export const getNearbyHospitals = async ({
//   latitude,
//   longitude,
//   radius = 10000,
// }) => {
//   const response = await api.get(
//     "/hospital/nearby",
//     {
//       params: {
//         latitude,
//         longitude,
//         radius,
//       },
//     }
//   );

//   return response.data;
// };

// // Get logged-in hospital profile
// export const getHospitalProfile =
//   async () => {
//     const response = await api.get(
//       "/hospital/me"
//     );

//     return response.data;
//   };

// // Update hospital profile
// export const updateHospitalProfile =
//   async (data) => {
//     const response = await api.patch(
//       "/hospital/profile",
//       data
//     );

//     return response.data;
//   };

// // Get hospital resources
// export const getHospitalResources =
//   async () => {
//     const response = await api.get(
//       "/hospital/resources"
//     );

//     return response.data;
//   };

// // Update hospital resource
// export const updateHospitalResource =
//   async (resourceType, data) => {
//     const response = await api.put(
//       `/hospital/resources/${resourceType}`,
//       data
//     );

//     return response.data;
//   };

// // Get incoming emergency requests
// export const getHospitalRequests =
//   async () => {
//     const response = await api.get(
//       "/hospital/requests"
//     );

//     return response.data;
//   };

// // Accept emergency request
// export const acceptHospitalRequest =
//   async (requestId) => {
//     const response = await api.post(
//       `/hospital/requests/${requestId}/accept`
//     );

//     return response.data;
//   };

// // Reject emergency request
// export const rejectHospitalRequest =
//   async (requestId) => {
//     const response = await api.post(
//       `/hospital/requests/${requestId}/reject`
//     );

//     return response.data;
//   };

//   export const getHospitalDashboard = async () => {
//   const response = await api.get('/hospital/dashboard');
//   return response.data;
// };

import api from "./axios";

export const getHospitalDashboard = async () => {
  const response = await api.get("/hospital/dashboard");
  return response.data;
};

export const getHospitalProfile = async () => {
  const response = await api.get("/hospital/me");
  return response.data;
};

export const updateHospitalProfile = async (data) => {
  const response = await api.patch(
    "/hospital/profile",
    data
  );

  return response.data;
};

export const changeHospitalPassword = async (data) => {
  const response = await api.patch(
    "/hospital/change-password",
    data
  );

  return response.data;
};

export const getHospitalResources = async () => {
  const response = await api.get("/hospital/resources");
  return response.data;
};

export const updateHospitalResource = async (
  resourceType,
  data
) => {
  const response = await api.put(
    `/hospital/resources/${resourceType}`,
    data
  );

  return response.data;
};

export const getHospitalRequests = async () => {
  const response = await api.get("/hospital/requests");
  return response.data;
};

export const acceptHospitalRequest = async (requestId) => {
  const response = await api.post(
    `/hospital/requests/${requestId}/accept`
  );

  return response.data;
};

export const rejectHospitalRequest = async (requestId) => {
  const response = await api.post(
    `/hospital/requests/${requestId}/reject`
  );

  return response.data;
};

// Get nearby hospitals
export const getNearbyHospitals = async ({
  latitude,
  longitude,
  radius = 10000,
}) => {
  const response = await api.get(
    "/hospital/nearby",
    {
      params: {
        latitude,
        longitude,
        radius,
      },
    }
  );

  return response.data;
};