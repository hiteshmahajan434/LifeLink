import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import HospitalLogin from "../pages/HospitalLogin";

import LandingPage from "../pages/LandingPage/LandingPage";
import Register from "../pages/Register";

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

      {/* Ambulance Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Existing Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Hospital Auth */}
      <Route path="/hospital/login" element={<HospitalLogin />} />

      {/* Temporary Registration */}
      <Route
        path="/ambulance/register"
        element={
          <div>
            Ambulance Registration - Coming Next
          </div>
        }
      />

      <Route
        path="/hospital/register"
        element={
          <div>
            Hospital Registration - Coming Next
          </div>
        }
      />

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