import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage/LandingPage";

// Shared shell (sidebar + header + workspace) — one layout for both roles
import AppLayout from "../components/layout/AppLayout";

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

      {/* Ambulance portal */}
      <Route path="/ambulance" element={<AppLayout role="AMBULANCE" />}>
        <Route index element={<AmbulanceHome />} />
        <Route path="requests" element={<AmbulanceRequests />} />
        <Route path="profile" element={<AmbulanceProfile />} />
      </Route>

      {/* Hospital portal */}
      <Route path="/hospital" element={<AppLayout role="HOSPITAL" />}>
        <Route index element={<HospitalDashboard />} />
        <Route path="requests" element={<HospitalRequests />} />
        <Route path="inventory" element={<HospitalInventory />} />
        <Route path="profile" element={<HospitalProfile />} />
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