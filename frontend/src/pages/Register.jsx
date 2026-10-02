import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Hospital,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  User,
  Building2,
  Bed,
  Wind,
  Droplets,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole =
    searchParams.get("role")?.toLowerCase() === "hospital"
      ? "hospital"
      : "ambulance";

  const [role, setRole] = useState(initialRole);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [location, setLocation] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",

    hospitalName: "",

    address: "",

    icuBeds: "",
    traumaBeds: "",
    generalBeds: "",
    ventilators: "",

    oxygenSupply: false,
    bloodBank: false,
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const changeRole = (newRole) => {
    setRole(newRole);
    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // GET CURRENT LOCATION
  // --------------------------------------------------

  const getCurrentLocation = () => {
    setError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setLocation({
          type: "Point",
          coordinates: [longitude, latitude],
        });

        setLocationLoading(false);
      },
      (err) => {
        console.error(err);

        let message = "Unable to get your location.";

        if (err.code === 1) {
          message =
            "Location permission was denied. Please allow location access.";
        } else if (err.code === 2) {
          message = "Your location could not be determined.";
        } else if (err.code === 3) {
          message = "Location request timed out.";
        }

        setError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Please enter your name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email.";
    }

    if (!form.password) {
      return "Please enter a password.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    if (role === "ambulance") {
      if (!form.mobile.trim()) {
        return "Please enter your mobile number.";
      }

      if (!form.hospitalName.trim()) {
        return "Please enter the hospital name.";
      }

      if (!location) {
        return "Please allow location access to register the ambulance.";
      }
    }

    if (role === "hospital") {
      if (!form.mobile.trim()) {
        return "Please enter the hospital phone number.";
      }

      if (!form.address.trim()) {
        return "Please enter the hospital address.";
      }

      if (!location) {
        return "Please allow location access to register the hospital.";
      }
    }

    return null;
  };

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      let payload;
      let endpoint;

      if (role === "ambulance") {
        endpoint = `${API_URL}/ambulance/register`;

        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          mobile: form.mobile.trim(),
          hospitalName: form.hospitalName.trim(),
          currentLocation: location,
        };
      } else {
        endpoint = `${API_URL}/hospital/register`;

        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.mobile.trim(),
          address: form.address.trim(),

          location,

          resources: {
            icuBeds: Number(form.icuBeds) || 0,
            traumaBeds: Number(form.traumaBeds) || 0,
            generalBeds: Number(form.generalBeds) || 0,
            ventilators: Number(form.ventilators) || 0,
            oxygenSupply: form.oxygenSupply,
            bloodBank: form.bloodBank,
          },
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Registration failed."
        );
      }

      // Backend automatically logs the user in
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.data)
      );

      localStorage.setItem("role", role);

      setSuccess("Registration successful!");

      setTimeout(() => {
        if (role === "ambulance") {
          navigate("/ambulance");
        } else {
          navigate("/hospital");
        }
      }, 700);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Something went wrong during registration."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // INPUT COMPONENT
  // --------------------------------------------------

  const InputField = ({
    label,
    icon: Icon,
    type = "text",
    value,
    onChange,
    placeholder,
    required = true,
  }) => {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-lifelink-text">
          {label}
          {required && (
            <span className="ml-1 text-lifelink-danger">*</span>
          )}
        </label>

        <div className="relative">
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-lifelink-muted"
          />

          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="h-12 w-full rounded-xl border border-lifelink-border bg-white pl-11 pr-4 text-sm text-lifelink-text outline-none transition placeholder:text-lifelink-muted focus:border-lifelink-lavender focus:ring-4 focus:ring-lifelink-lavender-soft"
          />
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-lifelink-bg p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1450px] overflow-hidden rounded-[28px] bg-white shadow-float md:min-h-[calc(100vh-3rem)]">

        {/* =================================================
            LEFT BRAND PANEL
        ================================================= */}

        <section className="relative hidden w-[43%] overflow-hidden bg-lifelink-dark lg:flex">
          
          {/* decorative circles */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lifelink-lime opacity-90" />

          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-lifelink-lavender opacity-80" />

          <div className="absolute right-16 top-[45%] h-20 w-20 rounded-full bg-lifelink-lime opacity-20" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}

            <button
              onClick={() => navigate("/")}
              className="flex w-fit items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lifelink-lime text-lifelink-dark">
                <ShieldCheck size={25} strokeWidth={2.5} />
              </div>

              <span className="text-2xl font-black tracking-tight text-white">
                Life<span className="text-lifelink-lime">Link</span>
              </span>
            </button>

            {/* Main content */}

            <div className="max-w-lg">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-widest text-lifelink-lime">
                <span className="h-2 w-2 rounded-full bg-lifelink-lime" />
                EMERGENCY RESPONSE NETWORK
              </div>

              <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.04em] text-white xl:text-6xl">
                Connect.
                <br />
                Respond.
                <br />

                <span className="text-lifelink-lime">
                  Save lives.
                </span>
              </h1>

              <p className="mt-7 max-w-md text-base leading-7 text-white/60">
                Join LifeLink and help connect ambulances,
                hospitals and emergency resources when every
                second matters.
              </p>

              {/* small stats */}

              <div className="mt-10 flex gap-3">

                <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    24/7
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Emergency network
                  </p>
                </div>

                <div className="rounded-2xl bg-lifelink-lavender px-5 py-4">
                  <p className="text-2xl font-black text-lifelink-dark">
                    AI
                  </p>
                  <p className="mt-1 text-xs text-lifelink-dark/60">
                    Smart coordination
                  </p>
                </div>

              </div>
            </div>

            <p className="text-xs text-white/35">
              Secure emergency coordination platform
            </p>

          </div>
        </section>

        {/* =================================================
            RIGHT REGISTER PANEL
        ================================================= */}

        <section className="flex flex-1 flex-col bg-lifelink-bg">

          {/* top */}

          <div className="flex items-center justify-between px-6 py-5 md:px-10">

            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm font-semibold text-lifelink-secondary transition hover:text-lifelink-text"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <p className="text-sm text-lifelink-secondary">
              Already registered?{" "}
              <button
                onClick={() =>
                  navigate(`/login?role=${role}`)
                }
                className="font-bold text-lifelink-text hover:underline"
              >
                Login
              </button>
            </p>

          </div>

          {/* form area */}

          <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 pb-10 md:px-10">

            <div className="w-full max-w-[650px]">

              {/* Heading */}

              <div className="mb-7">

                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-lifelink-lime text-lifelink-dark">
                  {role === "ambulance" ? (
                    <Truck size={24} />
                  ) : (
                    <Hospital size={24} />
                  )}
                </div>

                <h2 className="text-3xl font-black tracking-tight text-lifelink-text md:text-4xl">
                  Create your{" "}
                  {role === "ambulance"
                    ? "ambulance"
                    : "hospital"}{" "}
                  account
                </h2>

                <p className="mt-2 text-sm text-lifelink-secondary">
                  Set up your LifeLink profile to get started.
                </p>

              </div>

              {/* Role switch */}

              <div className="mb-7 grid grid-cols-2 rounded-2xl bg-white p-1.5 shadow-sm">

                <button
                  type="button"
                  onClick={() => changeRole("ambulance")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                    role === "ambulance"
                      ? "bg-lifelink-dark text-white shadow-sm"
                      : "text-lifelink-secondary hover:text-lifelink-text"
                  }`}
                >
                  <Truck size={17} />
                  Ambulance
                </button>

                <button
                  type="button"
                  onClick={() => changeRole("hospital")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                    role === "hospital"
                      ? "bg-lifelink-dark text-white shadow-sm"
                      : "text-lifelink-secondary hover:text-lifelink-text"
                  }`}
                >
                  <Hospital size={17} />
                  Hospital
                </button>

              </div>

              {/* Error */}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-critical/30 bg-critical-soft px-4 py-3 text-sm font-medium text-critical">
                  <span className="mt-0.5">!</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}

              {success && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary-strong/30 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-strong">
                  <Check size={18} />
                  {success}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* =========================================
                    BASIC INFORMATION
                ========================================= */}

                <div className="rounded-3xl bg-white p-5 shadow-sm md:p-6">

                  <div className="mb-5">
                    <h3 className="font-black text-lifelink-text">
                      Basic information
                    </h3>

                    <p className="mt-1 text-xs text-lifelink-muted">
                      Tell us who you are.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    <InputField
                      label={
                        role === "ambulance"
                          ? "Operator Name"
                          : "Hospital Name"
                      }
                      icon={
                        role === "ambulance"
                          ? User
                          : Building2
                      }
                      value={form.name}
                      placeholder={
                        role === "ambulance"
                          ? "Enter your name"
                          : "Enter hospital name"
                      }
                      onChange={(e) =>
                        updateField("name", e.target.value)
                      }
                    />

                    <InputField
                      label="Email"
                      icon={Mail}
                      type="email"
                      value={form.email}
                      placeholder="you@example.com"
                      onChange={(e) =>
                        updateField("email", e.target.value)
                      }
                    />

                    <InputField
                      label={
                        role === "ambulance"
                          ? "Mobile Number"
                          : "Phone Number"
                      }
                      icon={Phone}
                      type="tel"
                      value={form.mobile}
                      placeholder="9876543210"
                      onChange={(e) =>
                        updateField("mobile", e.target.value)
                      }
                    />

                    {role === "ambulance" && (
                      <InputField
                        label="Hospital Name"
                        icon={Hospital}
                        value={form.hospitalName}
                        placeholder="Associated hospital"
                        onChange={(e) =>
                          updateField(
                            "hospitalName",
                            e.target.value
                          )
                        }
                      />
                    )}

                    {role === "hospital" && (
                      <div className="md:col-span-2">
                        <InputField
                          label="Hospital Address"
                          icon={MapPin}
                          value={form.address}
                          placeholder="Full hospital address"
                          onChange={(e) =>
                            updateField(
                              "address",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}

                  </div>
                </div>

                {/* =========================================
                    LOCATION
                ========================================= */}

                <div className="rounded-3xl bg-white p-5 shadow-sm md:p-6">

                  <div className="mb-5 flex items-start justify-between gap-4">

                    <div>
                      <h3 className="font-black text-lifelink-text">
                        Location
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-lifelink-muted">
                        Your location helps LifeLink coordinate
                        emergency responses.
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lifelink-lavender-soft text-lifelink-dark">
                      <MapPin size={19} />
                    </div>

                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      location
                        ? "border-primary-strong/30 bg-primary-soft"
                        : "border-lifelink-border bg-lifelink-bg"
                    }`}
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            location
                              ? "bg-lifelink-success text-white"
                              : "bg-white text-lifelink-secondary"
                          }`}
                        >
                          {location ? (
                            <Check size={19} />
                          ) : (
                            <MapPin size={19} />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-lifelink-text">
                            {location
                              ? "Location captured"
                              : "Location not added"}
                          </p>

                          <p className="text-xs text-lifelink-muted">
                            {location
                              ? `${location.coordinates[1].toFixed(
                                  5
                                )}, ${location.coordinates[0].toFixed(
                                  5
                                )}`
                              : "Use your current location"}
                          </p>
                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="shrink-0 rounded-xl bg-lifelink-dark px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {locationLoading
                          ? "Locating..."
                          : location
                          ? "Update"
                          : "Use my location"}
                      </button>

                    </div>

                  </div>
                </div>

                {/* =========================================
                    HOSPITAL RESOURCES
                ========================================= */}

                {role === "hospital" && (
                  <div className="rounded-3xl bg-white p-5 shadow-sm md:p-6">

                    <div className="mb-5">

                      <h3 className="font-black text-lifelink-text">
                        Emergency resources
                      </h3>

                      <p className="mt-1 text-xs text-lifelink-muted">
                        Tell us what resources your hospital
                        currently provides.
                      </p>

                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">

                      <ResourceInput
                        icon={Bed}
                        label="ICU Beds"
                        value={form.icuBeds}
                        onChange={(e) =>
                          updateField(
                            "icuBeds",
                            e.target.value
                          )
                        }
                      />

                      <ResourceInput
                        icon={Bed}
                        label="Trauma Beds"
                        value={form.traumaBeds}
                        onChange={(e) =>
                          updateField(
                            "traumaBeds",
                            e.target.value
                          )
                        }
                      />

                      <ResourceInput
                        icon={Bed}
                        label="General Beds"
                        value={form.generalBeds}
                        onChange={(e) =>
                          updateField(
                            "generalBeds",
                            e.target.value
                          )
                        }
                      />

                      <ResourceInput
                        icon={Wind}
                        label="Ventilators"
                        value={form.ventilators}
                        onChange={(e) =>
                          updateField(
                            "ventilators",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      <Toggle
                        label="Oxygen Supply"
                        active={form.oxygenSupply}
                        onClick={() =>
                          updateField(
                            "oxygenSupply",
                            !form.oxygenSupply
                          )
                        }
                        icon={Wind}
                      />

                      <Toggle
                        label="Blood Bank"
                        active={form.bloodBank}
                        onClick={() =>
                          updateField(
                            "bloodBank",
                            !form.bloodBank
                          )
                        }
                        icon={Droplets}
                      />

                    </div>

                  </div>
                )}

                {/* =========================================
                    PASSWORD
                ========================================= */}

                <div className="rounded-3xl bg-white p-5 shadow-sm md:p-6">

                  <div className="mb-5">
                    <h3 className="font-black text-lifelink-text">
                      Secure your account
                    </h3>

                    <p className="mt-1 text-xs text-lifelink-muted">
                      Password must contain at least 6 characters.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    <PasswordField
                      label="Password"
                      value={form.password}
                      visible={showPassword}
                      onToggle={() =>
                        setShowPassword((prev) => !prev)
                      }
                      onChange={(e) =>
                        updateField(
                          "password",
                          e.target.value
                        )
                      }
                    />

                    <PasswordField
                      label="Confirm Password"
                      value={form.confirmPassword}
                      visible={showConfirmPassword}
                      onToggle={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      onChange={(e) =>
                        updateField(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>

                {/* =========================================
                    SUBMIT
                ========================================= */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-lifelink-lime text-sm font-black text-lifelink-dark shadow-float transition hover:-translate-y-0.5 hover:shadow-float disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-lifelink-dark/30 border-t-lifelink-dark" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create{" "}
                      {role === "ambulance"
                        ? "Ambulance"
                        : "Hospital"}{" "}
                      Account
                      <ArrowRight
                        size={18}
                        className="transition group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-5 text-lifelink-muted">
                  By creating an account, you agree to use
                  LifeLink only for legitimate emergency
                  response coordination.
                </p>

              </form>

            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

// ======================================================
// RESOURCE INPUT
// ======================================================

function ResourceInput({
  icon: Icon,
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-lifelink-secondary">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-lifelink-lavender"
        />

        <input
          type="number"
          min="0"
          value={value}
          onChange={onChange}
          placeholder="0"
          className="h-12 w-full rounded-xl border border-lifelink-border bg-lifelink-bg pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-lifelink-lavender focus:bg-white focus:ring-4 focus:ring-lifelink-lavender-soft"
        />
      </div>
    </div>
  );
}

// ======================================================
// TOGGLE
// ======================================================

function Toggle({
  label,
  active,
  onClick,
  icon: Icon,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
        active
          ? "border-lifelink-lime bg-lifelink-lime-soft"
          : "border-lifelink-border bg-lifelink-bg hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-3">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            active
              ? "bg-lifelink-lime text-lifelink-dark"
              : "bg-white text-lifelink-secondary"
          }`}
        >
          <Icon size={17} />
        </div>

        <span className="text-sm font-bold text-lifelink-text">
          {label}
        </span>

      </div>

      <div
        className={`flex h-6 w-10 items-center rounded-full p-1 transition ${
          active
            ? "bg-lifelink-dark"
            : "bg-lifelink-border"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${
            active ? "translate-x-4" : ""
          }`}
        />
      </div>
    </button>
  );
}

// ======================================================
// PASSWORD FIELD
// ======================================================

function PasswordField({
  label,
  value,
  visible,
  onToggle,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-lifelink-text">
        {label}
        <span className="ml-1 text-lifelink-danger">*</span>
      </label>

      <div className="relative">

        <LockKeyhole
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-lifelink-muted"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-lifelink-border bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-lifelink-muted focus:border-lifelink-lavender focus:ring-4 focus:ring-lifelink-lavender-soft"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-lifelink-muted hover:text-lifelink-text"
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>

      </div>
    </div>
  );
}