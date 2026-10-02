import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login,
  register,
} from "../api/auth.api";

import {
  getAmbulanceProfile,
} from "../api/ambulance.api";

import {
  getHospitalProfile,
} from "../api/hospital.api";

import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [role, setRole] = useState(() =>
    localStorage.getItem("role")
  );

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();


  // =====================================================
  // RESTORE SESSION
  // =====================================================

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken =
        localStorage.getItem("token");

      const storedRole =
        localStorage.getItem("role");

      if (!storedToken || !storedRole) {
        setLoading(false);
        return;
      }

      try {
        let response;

        if (storedRole === "AMBULANCE") {
          response =
            await getAmbulanceProfile();
        } else if (storedRole === "HOSPITAL") {
          response =
            await getHospitalProfile();
        } else {
          throw new Error(
            "Unknown user role"
          );
        }

        if (response.success) {
          setUser(response.data);
          setToken(storedToken);
          setRole(storedRole);
        } else {
          throw new Error(
            "Session is no longer valid"
          );
        }
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );

        localStorage.removeItem("token");
        localStorage.removeItem("role");

        setToken(null);
        setRole(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const loginAs = async (
    selectedRole,
    credentials
  ) => {
    const response = await login(
      selectedRole,
      credentials
    );

    if (response.success) {
      const normalizedRole =
        selectedRole === "ambulance"
          ? "AMBULANCE"
          : "HOSPITAL";

      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "role",
        normalizedRole
      );

      setToken(response.token);
      setRole(normalizedRole);
      setUser(response.data);
    }

    return response;
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const registerAs = async (
    selectedRole,
    data
  ) => {
    const response = await register(
      selectedRole,
      data
    );

    if (response.success) {
      const normalizedRole =
        selectedRole === "ambulance"
          ? "AMBULANCE"
          : "HOSPITAL";

      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "role",
        normalizedRole
      );

      setToken(response.token);
      setRole(normalizedRole);
      setUser(response.data);
    }

    return response;
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    setToken(null);
    setRole(null);
    setUser(null);
    
    navigate("/");
  };

  // =====================================================
  // UPDATE USER (e.g. after the profile page saves changes)
  // =====================================================

  const updateUser = (data) =>
    setUser((previous) => ({ ...previous, ...data }));

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value = {
    user,
    token,
    role,
    loading,

    isAuthenticated:
      !!token && !!user,

    loginAs,
    registerAs,

    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// HOOK
// =====================================================

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};