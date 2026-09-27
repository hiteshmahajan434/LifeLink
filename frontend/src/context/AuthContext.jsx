import { createContext, useContext, useEffect, useState } from "react";
import {
  loginAmbulance,
  registerAmbulance,
  getAmbulanceProfile,
} from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Restore logged-in user when the app starts
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getAmbulanceProfile();

        if (response.success) {
          setUser(response.data);
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Session restore failed:", error);

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Login
  const login = async (credentials) => {
    const response = await loginAmbulance(credentials);

    if (response.success) {
      localStorage.setItem("token", response.token);

      setToken(response.token);
      setUser(response.data);
    }

    return response;
  };

  // Register
  const register = async (ambulanceData) => {
    const response = await registerAmbulance(ambulanceData);

    if (response.success) {
      localStorage.setItem("token", response.token);

      setToken(response.token);
      setUser(response.data);
    }

    return response;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,

    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};