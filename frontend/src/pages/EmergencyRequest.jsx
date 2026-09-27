import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createEmergencyRequest } from "../api/emergency.api";
import { useCurrentLocation } from "../hooks/useCurrentLocation";

const EMERGENCY_TYPES = [
  {
    value: "ROAD_ACCIDENT",
    label: "Road Accident",
  },
  {
    value: "CARDIAC_EMERGENCY",
    label: "Cardiac Emergency",
  },
  {
    value: "BREATHING_EMERGENCY",
    label: "Breathing Emergency",
  },
  {
    value: "STROKE",
    label: "Stroke",
  },
  {
    value: "SEVERE_INJURY",
    label: "Severe Injury",
  },
  {
    value: "BURN",
    label: "Burn",
  },
  {
    value: "POISONING",
    label: "Poisoning",
  },
  {
    value: "PREGNANCY",
    label: "Pregnancy",
  },
  {
    value: "UNCONSCIOUS",
    label: "Unconscious",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const EmergencyRequest = () => {
  const navigate = useNavigate();

  const { fetchLocation } = useCurrentLocation();

  const [text, setText] = useState("");
  const [emergencyType, setEmergencyType] = useState("");

  const [resources, setResources] = useState({
    icuBeds: 0,
    traumaBeds: 0,
    generalBeds: 0,
    ventilators: 0,
    oxygenSupply: false,
    bloodBank: false,
  });

  const [useQuickSelect, setUseQuickSelect] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResourceChange = (field, value) => {
    setResources((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!text.trim() && !useQuickSelect) {
      setError(
        "Please describe the emergency or use Quick Select."
      );
      return;
    }

    if (useQuickSelect && !emergencyType) {
      setError("Please select an emergency type.");
      return;
    }

    setLoading(true);

    try {
      // Get current GPS location
      const currentLocation = await fetchLocation();

      if (!currentLocation) {
        setError(
          "Unable to get your location. Please allow location access."
        );
        return;
      }

      const payload = {
        inputs: {
          text: text.trim() || null,

          voiceTranscript: null,

          quickSelect: useQuickSelect
            ? {
                emergencyType,
                requiredResources: resources,
              }
            : null,
        },

        location: {
          type: "Point",
          coordinates: [
            currentLocation.longitude,
            currentLocation.latitude,
          ],
        },
      };

      const response = await createEmergencyRequest(payload);

      if (response.success) {
        // Store the returned emergency temporarily.
        sessionStorage.setItem(
          "currentEmergency",
          JSON.stringify(response.data)
        );

        navigate("/emergency/review");
      }
    } catch (error) {
      console.error(
        "Emergency request creation failed:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to create emergency request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate("/dashboard")}>
        ← Back
      </button>

      <h1>Create Emergency Request</h1>

      <form onSubmit={handleSubmit}>
        <section>
          <h2>Describe the Emergency</h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what happened..."
            rows={6}
          />
        </section>

        <section>
          <h2>Quick Select</h2>

          <label>
            <input
              type="checkbox"
              checked={useQuickSelect}
              onChange={(e) =>
                setUseQuickSelect(e.target.checked)
              }
            />

            Use Quick Select
          </label>

          {useQuickSelect && (
            <>
              <div>
                <label>
                  Emergency Type
                </label>

                <select
                  value={emergencyType}
                  onChange={(e) =>
                    setEmergencyType(e.target.value)
                  }
                >
                  <option value="">
                    Select emergency type
                  </option>

                  {EMERGENCY_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <h3>Required Resources</h3>

              <div>
                <label>
                  ICU Beds
                  <input
                    type="number"
                    min="0"
                    value={resources.icuBeds}
                    onChange={(e) =>
                      handleResourceChange(
                        "icuBeds",
                        Number(e.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  Trauma Beds
                  <input
                    type="number"
                    min="0"
                    value={resources.traumaBeds}
                    onChange={(e) =>
                      handleResourceChange(
                        "traumaBeds",
                        Number(e.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  General Beds
                  <input
                    type="number"
                    min="0"
                    value={resources.generalBeds}
                    onChange={(e) =>
                      handleResourceChange(
                        "generalBeds",
                        Number(e.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  Ventilators
                  <input
                    type="number"
                    min="0"
                    value={resources.ventilators}
                    onChange={(e) =>
                      handleResourceChange(
                        "ventilators",
                        Number(e.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={resources.oxygenSupply}
                    onChange={(e) =>
                      handleResourceChange(
                        "oxygenSupply",
                        e.target.checked
                      )
                    }
                  />

                  Oxygen Supply
                </label>
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={resources.bloodBank}
                    onChange={(e) =>
                      handleResourceChange(
                        "bloodBank",
                        e.target.checked
                      )
                    }
                  />

                  Blood Bank
                </label>
              </div>
            </>
          )}
        </section>

        {error && (
          <p>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Analyzing Emergency..."
            : "Create Emergency Request"}
        </button>
      </form>
    </div>
  );
};

export default EmergencyRequest;