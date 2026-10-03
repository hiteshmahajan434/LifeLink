import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  UserPlus,
} from "lucide-react";

import RoleTabs from "./RoleTabs";
import { useAuth } from "../../context/AuthContext";
import LocationPicker from "../map/LocationPicker";

const RegisterForm = ({
  role,
  setRole,
  onLogin,
  onSuccess,
  onBack,
}) => {
  const { registerAs } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    hospitalName: "",
    address: "",

    icuBeds: 0,
    traumaBeds: 0,
    generalBeds: 0,
    ventilators: 0,
    oxygenSupply: false,
    bloodBank: false,
  });

  const [location, setLocation] = useState(null);

  const [locationPickerOpen, setLocationPickerOpen] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =====================================================
  // LOCATION PICKER
  // =====================================================

  const handleLocationConfirm = ({
    latitude,
    longitude,
  }) => {
    setLocation({
      type: "Point",
      coordinates: [
        longitude,
        latitude,
      ],
    });

    setError("");
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.phone.trim()
    ) {
      setError(
        "Please fill in all required fields."
      );
      return;
    }

    if (!location) {
      setError(
        "Please select your location on the map."
      );
      return;
    }

    try {
      setLoading(true);

      let payload;

      // =================================================
      // AMBULANCE
      // =================================================

      if (role === "ambulance") {
        payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          mobile: formData.phone.trim(),
          hospitalName:
            formData.hospitalName.trim(),

          currentLocation: location,
        };
      }

      // =================================================
      // HOSPITAL
      // =================================================

      else {
        payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim(),
          address: formData.address.trim(),

          location,

          resources: {
            icuBeds: Number(
              formData.icuBeds
            ),
            traumaBeds: Number(
              formData.traumaBeds
            ),
            generalBeds: Number(
              formData.generalBeds
            ),
            ventilators: Number(
              formData.ventilators
            ),
            oxygenSupply:
              formData.oxygenSupply,
            bloodBank:
              formData.bloodBank,
          },
        };
      }

      const response = await registerAs(
        role,
        payload
      );

      if (response?.success) {
        onSuccess(response);
      } else {
        setError(
          response?.message ||
            "Registration failed. Please try again."
        );
      }
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* ================================================= */}
      {/* BACK */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-ink-muted">
          CREATE ACCOUNT
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Join LifeLink.
        </h1>

        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Register your emergency response portal.
        </p>
      </div>

      {/* ================================================= */}
      {/* ROLE */}
      {/* ================================================= */}

      <RoleTabs
        role={role}
        setRole={setRole}
      />

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        {/* ================================================= */}
        {/* NAME */}
        {/* ================================================= */}

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">
            {role === "ambulance"
              ? "Ambulance name"
              : "Hospital name"}
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={
              role === "ambulance"
                ? "Enter ambulance name"
                : "Enter hospital name"
            }
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-muted focus:border-ink"
          />
        </div>

        {/* ================================================= */}
        {/* EMAIL */}
        {/* ================================================= */}

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-muted focus:border-ink"
          />
        </div>

        {/* ================================================= */}
        {/* PHONE */}
        {/* ================================================= */}

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">
            Phone
          </label>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-muted focus:border-ink"
          />
        </div>

        {/* ================================================= */}
        {/* AMBULANCE ONLY */}
        {/* ================================================= */}

        {role === "ambulance" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-soft">
              Hospital name
            </label>

            <input
              type="text"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleChange}
              placeholder="Associated hospital"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-muted focus:border-ink"
            />
          </div>
        )}

        {/* ================================================= */}
        {/* HOSPITAL ONLY */}
        {/* ================================================= */}

        {role === "hospital" && (
          <>
            {/* Address */}

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-soft">
                Address
              </label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                placeholder="Hospital address"
                className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-muted focus:border-ink"
              />
            </div>

            {/* Resources */}

            <div className="grid grid-cols-2 gap-3">
              {[
                ["icuBeds", "ICU beds"],
                ["traumaBeds", "Trauma beds"],
                ["generalBeds", "General beds"],
                ["ventilators", "Ventilators"],
              ].map(([name, label]) => (
                <div key={name}>
                  <label className="mb-2 block text-xs font-medium text-ink-soft">
                    {label}
                  </label>

                  <input
                    type="number"
                    min="0"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
                  />
                </div>
              ))}
            </div>

            {/* Resources toggles */}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  name="oxygenSupply"
                  checked={
                    formData.oxygenSupply
                  }
                  onChange={handleChange}
                />

                Oxygen supply
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  name="bloodBank"
                  checked={
                    formData.bloodBank
                  }
                  onChange={handleChange}
                />

                Blood bank
              </label>
            </div>
          </>
        )}

        {/* ================================================= */}
        {/* PASSWORD */}
        {/* ================================================= */}

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
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-11 text-sm outline-none placeholder:text-ink-muted focus:border-ink"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (prev) => !prev
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* LOCATION */}
        {/* ================================================= */}

        <button
          type="button"
          onClick={() =>
            setLocationPickerOpen(true)
          }
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
            location
              ? "border-primary-strong/30 bg-primary-soft text-primary-strong"
              : "border-line bg-white text-ink-soft hover:border-ink"
          }`}
        >
          {location ? (
            <Check size={17} />
          ) : (
            <MapPin size={17} />
          )}

          {location
            ? "Location selected"
            : "Select location on map"}
        </button>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="rounded-xl border border-critical/30 bg-critical-soft px-4 py-3 text-sm text-critical">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* CREATE ACCOUNT */}
        {/* ================================================= */}

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
              Creating account...
            </>
          ) : (
            <>
              <UserPlus size={17} />
              Create account
            </>
          )}
        </button>
      </form>

      {/* ================================================= */}
      {/* LOGIN */}
      {/* ================================================= */}

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onLogin}
          className="font-semibold text-ink underline underline-offset-4"
        >
          Sign in
        </button>
      </p>

      {/* ================================================= */}
      {/* LOCATION PICKER */}
      {/* ================================================= */}

      <LocationPicker
        open={locationPickerOpen}
        onClose={() =>
          setLocationPickerOpen(false)
        }
        onConfirm={handleLocationConfirm}
        initialLocation={
          location
            ? {
                latitude:
                  location.coordinates[1],
                longitude:
                  location.coordinates[0],
              }
            : null
        }
      />
    </div>
  );
};

export default RegisterForm;