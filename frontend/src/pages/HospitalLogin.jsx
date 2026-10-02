import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HospitalLogin = () => {
  const navigate = useNavigate();
  const { loginAsHospital } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

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
    setLoading(true);

    try {
      const response = await loginAsHospital(formData);

      if (response.success) {
        navigate("/hospital/dashboard");
      }
    } catch (error) {
      console.error("Hospital login failed:", error);

      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>LifeLink</h1>
      <h2>Hospital Login</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifier">
            Hospital ID / Email
          </label>

          <input
            id="identifier"
            name="identifier"
            type="text"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="HOSP-100 or hospital@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/")}
      >
        Back
      </button>
    </div>
  );
};

export default HospitalLogin;