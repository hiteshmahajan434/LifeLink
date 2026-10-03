import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage/LandingPage";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import AmbulanceHome from "../pages/ambulance/AmbulanceHome";
import AmbulanceRequests from "../pages/ambulance/AmbulanceRequests";
import AmbulanceProfile from "../pages/ambulance/AmbulanceProfile";

import HospitalDashboard from "../pages/hospital/HospitalDashboard";
import HospitalRequests from "../pages/hospital/HospitalRequests";
import HospitalInventory from "../pages/hospital/HospitalInventory";
import HospitalProfile from "../pages/hospital/HospitalProfile";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* ================================================= */}
      {/* Ambulance Portal */}
      {/* ================================================= */}

      <Route element={<ProtectedRoute allowedRole="AMBULANCE" />}>
        <Route
          path="/ambulance"
          element={<AppLayout role="AMBULANCE" />}
        >
          <Route index element={<AmbulanceHome />} />
          <Route
            path="requests"
            element={<AmbulanceRequests />}
          />
          <Route
            path="profile"
            element={<AmbulanceProfile />}
          />
        </Route>
      </Route>

      {/* ================================================= */}
      {/* Hospital Portal */}
      {/* ================================================= */}

      <Route element={<ProtectedRoute allowedRole="HOSPITAL" />}>
        <Route
          path="/hospital"
          element={<AppLayout role="HOSPITAL" />}
        >
          <Route index element={<HospitalDashboard />} />
          <Route
            path="requests"
            element={<HospitalRequests />}
          />
          <Route
            path="inventory"
            element={<HospitalInventory />}
          />
          <Route
            path="profile"
            element={<HospitalProfile />}
          />
        </Route>
      </Route>

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;