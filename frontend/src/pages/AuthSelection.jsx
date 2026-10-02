import { useNavigate } from "react-router-dom";

const AuthSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-selection">
      <div className="auth-selection-header">
        <h1>LifeLink</h1>
        <p>Emergency Response Platform</p>
        <h2>How do you want to continue?</h2>
      </div>

      <div className="role-cards">
        {/* Ambulance */}
        <div className="role-card">
          <div className="role-icon">🚑</div>

          <h3>Ambulance</h3>
          <p>
            Manage emergency requests, view nearby hospitals,
            and coordinate patient transport.
          </p>

          <div className="role-actions">
            <button onClick={() => navigate("/login")}>
              Login
            </button>

            <button
              className="secondary"
              onClick={() => navigate("/ambulance/register")}
            >
              Register
            </button>
          </div>
        </div>

        {/* Hospital */}
        <div className="role-card">
          <div className="role-icon">🏥</div>

          <h3>Hospital</h3>
          <p>
            Manage hospital resources and respond to
            incoming emergency requests.
          </p>

          <div className="role-actions">
            <button onClick={() => navigate("/hospital/login")}>
              Login
            </button>

            <button
              className="secondary"
              onClick={() => navigate("/hospital/register")}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSelection;