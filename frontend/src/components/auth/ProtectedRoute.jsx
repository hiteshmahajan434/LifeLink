import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // Wait until session restoration is complete.
  if (loading) {
    return null;
  }

  // No valid session.
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Logged in but trying to access the wrong portal.
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;