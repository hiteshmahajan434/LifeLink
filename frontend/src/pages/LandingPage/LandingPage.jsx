import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BrandPanel from "../../components/auth/BrandPanel";
import PortalSelection from "../../components/auth/PortalSelection";
import LoginForm from "../../components/auth/LoginForm";
import RegisterForm from "../../components/auth/RegisterForm";

const LandingPage = () => {
  const navigate = useNavigate();

  const [authMode, setAuthMode] =
    useState("portal");

  const [role, setRole] =
    useState("ambulance");

  const handlePortalContinue = () => {
    setAuthMode("login");
  };

  const handleLoginSuccess = () => {
    if (role === "ambulance") {
      navigate("/ambulance");
    } else {
      navigate("/hospital");
    }
  };

  const handleRegisterSuccess = () => {
    if (role === "ambulance") {
      navigate("/ambulance");
    } else {
      navigate("/hospital");
    }
  };

  return (
    <main className="min-h-screen bg-workspace font-[Inter,sans-serif]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <BrandPanel />

        <section className="flex min-h-screen items-center justify-center bg-card-muted px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div
            className={`w-full max-w-[470px] ${
              authMode === "register"
                ? "my-4"
                : ""
            }`}
          >
            {authMode === "portal" && (
              <PortalSelection
                role={role}
                setRole={setRole}
                onContinue={
                  handlePortalContinue
                }
              />
            )}

            {authMode === "login" && (
              <LoginForm
                role={role}
                setRole={setRole}
                onRegister={() =>
                  setAuthMode("register")
                }
                onBack={() =>
                  setAuthMode("portal")
                }
                onSuccess={
                  handleLoginSuccess
                }
              />
            )}

            {authMode === "register" && (
              <RegisterForm
                role={role}
                setRole={setRole}
                onLogin={() =>
                  setAuthMode("login")
                }
                onBack={() =>
                  setAuthMode("portal")
                }
                onSuccess={
                  handleRegisterSuccess
                }
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default LandingPage;