import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
} from "lucide-react";

import RoleTabs from "./RoleTabs";
import { useAuth } from "../../context/AuthContext";

const LoginForm = ({
  role,
  setRole,
  onRegister,
  onSuccess,
}) => {
  const { loginAs } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.identifier.trim() ||
      !formData.password
    ) {
      setError(
        "Please enter your email/identifier and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await loginAs(
        role,
        {
          identifier:
            formData.identifier.trim(),
          password: formData.password,
        }
      );

      if (response?.success) {
        onSuccess(response);
      } else {
        setError(
          response?.message ||
            "Login failed. Please try again."
        );
      }
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="mb-7 flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-7">
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-ink-muted">
          SECURE LOGIN
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Welcome back.
        </h1>

        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Sign in to access your LifeLink portal.
        </p>
      </div>

      <RoleTabs
        role={role}
        setRole={setRole}
      />

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">
            Email or identifier
          </label>

          <input
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink-muted focus:border-ink"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">
            Password
          </label>

          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-11 text-sm outline-none transition placeholder:text-ink-muted focus:border-ink"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (prev) => !prev
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-critical/30 bg-critical-soft px-4 py-3 text-sm text-critical">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={17} />
              Sign in
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-semibold text-ink underline underline-offset-4"
        >
          Register
        </button>
      </p>
    </div>
  );
};

export default LoginForm;