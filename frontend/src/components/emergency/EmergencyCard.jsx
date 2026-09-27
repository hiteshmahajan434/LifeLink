import { useEffect, useState } from "react";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

import {
  createEmergencyRequest,
  updateEmergencyRequest,
  cancelEmergencyRequest,
  confirmEmergencyRequest,
} from "../../api/emergency.api";

const EMERGENCY_TYPES = [
  ["ROAD_ACCIDENT", "Road Accident"],
  ["CARDIAC_EMERGENCY", "Cardiac Emergency"],
  ["BREATHING_EMERGENCY", "Breathing Emergency"],
  ["STROKE", "Stroke"],
  ["SEVERE_INJURY", "Severe Injury"],
  ["BURN", "Burn"],
  ["POISONING", "Poisoning"],
  ["PREGNANCY", "Pregnancy"],
  ["UNCONSCIOUS", "Unconscious"],
  ["OTHER", "Other"],
];

const emptyResources = {
  icuBeds: 0,
  traumaBeds: 0,
  generalBeds: 0,
  ventilators: 0,
  oxygenSupply: false,
  bloodBank: false,
};

const EmergencyCard = () => {
  const { fetchLocation } = useCurrentLocation();

  const {
    isSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  const [step, setStep] = useState("form");

  const [emergency, setEmergency] = useState(null);
  const [matchedHospitals, setMatchedHospitals] = useState([]);

  const [text, setText] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [resources, setResources] = useState(emptyResources);

  const [inputMode, setInputMode] = useState("quickSelect");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------
  // VOICE TRANSCRIPT
  // -----------------------------------------

  useEffect(() => {
    if (transcript && inputMode === "voice") {
      setText(transcript);
    }
  }, [transcript, inputMode]);

  // -----------------------------------------
  // RESOURCE CHANGE
  // -----------------------------------------

  const handleResourceChange = (field, value) => {
    setResources((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -----------------------------------------
  // INPUT MODE
  // -----------------------------------------

  const selectInputMode = (mode) => {
    setInputMode(mode);
    setError("");

    if (mode === "voice") {
      setText("");
      clearTranscript();
    }
  };

  // -----------------------------------------
  // VOICE
  // -----------------------------------------

  const handleVoice = () => {
    setError("");

    if (!isSupported) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    setInputMode("voice");
    setText("");
    clearTranscript();

    startListening();
  };

  // -----------------------------------------
  // CREATE
  // -----------------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    setError("");

    if (inputMode === "text" && !text.trim()) {
      setError("Please describe the emergency.");
      return;
    }

    if (inputMode === "voice" && !text.trim()) {
      setError("Please speak the emergency details.");
      return;
    }

    if (inputMode === "quickSelect" && !emergencyType) {
      setError("Please select an emergency type.");
      return;
    }

    setLoading(true);

    try {
      const location = await fetchLocation();

      if (!location) {
        setError(
          "Location access is required to create an emergency."
        );
        return;
      }

      const payload = {
        inputs: {
          text:
            inputMode === "text"
              ? text.trim() || null
              : null,

          voiceTranscript:
            inputMode === "voice"
              ? text.trim() || null
              : null,

          quickSelect:
            inputMode === "quickSelect"
              ? {
                  emergencyType,
                  requiredResources: resources,
                }
              : null,
        },

        location: {
          type: "Point",
          coordinates: [
            location.longitude,
            location.latitude,
          ],
        },
      };

      const response = await createEmergencyRequest(payload);

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to create emergency."
        );
      }

      setEmergency(response.data);
      setStep("review");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to create emergency."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // EDIT
  // -----------------------------------------

  const handleEdit = () => {
    if (!emergency?.aiParsedRequirements) {
      return;
    }

    const requirements =
      emergency.aiParsedRequirements;

    setText(requirements.description || "");

    setEmergencyType(
      requirements.emergencyType || ""
    );

    setResources(
      requirements.requiredResources ||
        emptyResources
    );

    setInputMode("quickSelect");

    setError("");
    setStep("edit");
  };

  // -----------------------------------------
  // SAVE EDIT
  // -----------------------------------------

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!emergency) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const confirmedRequirements = {
        description: text.trim(),

        emergencyType,

        patients:
          emergency.aiParsedRequirements
            ?.patients || [],

        requiredResources: resources,
      };

      const response =
        await updateEmergencyRequest(
          emergency._id,
          {
            confirmedRequirements,
          }
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to update emergency."
        );
      }

      setEmergency(response.data);
      setStep("review");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update emergency."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // CANCEL
  // -----------------------------------------

  const handleCancel = async () => {
    if (!emergency?._id) {
      resetCard();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await cancelEmergencyRequest(
          emergency._id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to cancel emergency."
        );
      }

      resetCard();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to cancel emergency."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // CONFIRM
  // -----------------------------------------

  const handleConfirm = async () => {
    if (!emergency?._id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await confirmEmergencyRequest(
          emergency._id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to confirm emergency."
        );
      }

      setEmergency(response.data.emergency);

      setMatchedHospitals(
        response.data.hospitals || []
      );

      setStep("confirmed");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to confirm emergency."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // RESET
  // -----------------------------------------

  const resetCard = () => {
    setStep("form");

    setEmergency(null);
    setMatchedHospitals([]);

    setText("");
    setEmergencyType("");
    setResources(emptyResources);

    setInputMode("quickSelect");

    setError("");

    clearTranscript();

    if (isListening) {
      stopListening();
    }
  };

  // -----------------------------------------
  // HELPERS
  // -----------------------------------------

  const getEmergencyLabel = (value) => {
    return (
      EMERGENCY_TYPES.find(
        ([type]) => type === value
      )?.[1] || value || "Not specified"
    );
  };

  const getResourceCount = () => {
    let count = 0;

    if (resources.icuBeds > 0) count++;
    if (resources.traumaBeds > 0) count++;
    if (resources.generalBeds > 0) count++;
    if (resources.ventilators > 0) count++;
    if (resources.oxygenSupply) count++;
    if (resources.bloodBank) count++;

    return count;
  };

  // =========================================
  // FORM
  // =========================================

  if (step === "form") {
    return (
      <section className="emergency-card">
        {/* HEADER */}

        <div className="emergency-card-top">
          <div className="emergency-title">
            <div className="emergency-icon">
              🚨
            </div>

            <div>
              <h2>Emergency Assistance</h2>

              <p>
                Create an emergency request and
                find suitable hospitals nearby.
              </p>
            </div>
          </div>

          <div className="emergency-badge">
            Emergency
          </div>
        </div>

        {/* FLOW */}

        <div className="emergency-flow">
          <div className="flow-item active">
            <span>1</span>
            <div>
              <strong>Report</strong>
              <small>Tell us what happened</small>
            </div>
          </div>

          <div className="flow-line" />

          <div className="flow-item">
            <span>2</span>
            <div>
              <strong>Review</strong>
              <small>Verify requirements</small>
            </div>
          </div>

          <div className="flow-line" />

          <div className="flow-item">
            <span>3</span>
            <div>
              <strong>Confirm</strong>
              <small>Contact hospitals</small>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate}>
          {/* INPUT METHOD */}

          <div className="emergency-section">
            <div className="section-heading">
              <div>
                <h3>How would you like to report?</h3>
                <p>
                  Choose one method to provide the
                  emergency details.
                </p>
              </div>
            </div>

            <div className="input-method-grid">
              {/* QUICK SELECT */}

              <button
                type="button"
                className={`input-method ${
                  inputMode === "quickSelect"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectInputMode("quickSelect")
                }
              >
                <div className="method-icon">
                  ⚡
                </div>

                <div>
                  <strong>Quick Select</strong>

                  <span>
                    Select emergency type and
                    resources
                  </span>
                </div>

                {inputMode === "quickSelect" && (
                  <div className="selected-check">
                    ✓
                  </div>
                )}
              </button>

              {/* TEXT */}

              <button
                type="button"
                className={`input-method ${
                  inputMode === "text"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectInputMode("text")
                }
              >
                <div className="method-icon">
                  📝
                </div>

                <div>
                  <strong>Describe</strong>

                  <span>
                    Explain the situation in your
                    own words
                  </span>
                </div>

                {inputMode === "text" && (
                  <div className="selected-check">
                    ✓
                  </div>
                )}
              </button>

              {/* VOICE */}

              <button
                type="button"
                className={`input-method ${
                  inputMode === "voice"
                    ? "selected"
                    : ""
                }`}
                onClick={handleVoice}
              >
                <div
                  className={`method-icon ${
                    isListening
                      ? "listening"
                      : ""
                  }`}
                >
                  🎙️
                </div>

                <div>
                  <strong>
                    {isListening
                      ? "Listening..."
                      : "Voice Input"}
                  </strong>

                  <span>
                    {isListening
                      ? "Speak clearly..."
                      : "Describe the emergency verbally"}
                  </span>
                </div>

                {inputMode === "voice" &&
                  !isListening && (
                    <div className="selected-check">
                      ✓
                    </div>
                  )}
              </button>
            </div>
          </div>

          {/* DESCRIPTION */}

          {(inputMode === "text" ||
            inputMode === "voice") && (
            <div className="emergency-section">
              <div className="section-heading">
                <div>
                  <h3>
                    {inputMode === "voice"
                      ? "Voice Description"
                      : "Emergency Description"}
                  </h3>

                  <p>
                    {inputMode === "voice"
                      ? "Your spoken description will appear below."
                      : "Describe what happened and any important patient details."}
                  </p>
                </div>

                {inputMode === "voice" && (
                  <button
                    type="button"
                    className={`voice-button ${
                      isListening
                        ? "recording"
                        : ""
                    }`}
                    onClick={handleVoice}
                  >
                    {isListening
                      ? "⏹ Stop"
                      : "🎙 Start"}
                  </button>
                )}
              </div>

              <textarea
                className="emergency-textarea"
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                placeholder="Example: There has been a road accident involving two people. One person has a serious leg injury..."
                rows={5}
              />

              {inputMode === "voice" && (
                <div className="voice-status">
                  <span
                    className={
                      isListening
                        ? "status-dot listening-dot"
                        : "status-dot"
                    }
                  />

                  {isListening
                    ? "Listening for your emergency description..."
                    : "Voice recording stopped. You can edit the transcript above."}
                </div>
              )}
            </div>
          )}

          {/* QUICK SELECT */}

          {inputMode === "quickSelect" && (
            <div className="emergency-section">
              <div className="section-heading">
                <div>
                  <h3>Emergency Details</h3>

                  <p>
                    Select the type of emergency and
                    resources required.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Emergency Type
                </label>

                <select
                  className="emergency-select"
                  value={emergencyType}
                  onChange={(e) =>
                    setEmergencyType(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select emergency type
                  </option>

                  {EMERGENCY_TYPES.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="resource-header">
                <div>
                  <h4>Required Resources</h4>

                  <p>
                    Tell hospitals what resources
                    may be needed.
                  </p>
                </div>

                <span>
                  {getResourceCount()} selected
                </span>
              </div>

              <div className="resource-grid">
                {[
                  ["icuBeds", "ICU Beds", "🏥"],
                  [
                    "traumaBeds",
                    "Trauma Beds",
                    "🛏️",
                  ],
                  [
                    "generalBeds",
                    "General Beds",
                    "🛌",
                  ],
                  [
                    "ventilators",
                    "Ventilators",
                    "💨",
                  ],
                ].map(
                  ([field, label, icon]) => (
                    <div
                      className="resource-card"
                      key={field}
                    >
                      <div className="resource-icon">
                        {icon}
                      </div>

                      <div className="resource-info">
                        <span>{label}</span>

                        <input
                          type="number"
                          min="0"
                          value={resources[field]}
                          onChange={(e) =>
                            handleResourceChange(
                              field,
                              Number(
                                e.target.value
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="resource-toggle-grid">
                <label
                  className={`resource-toggle ${
                    resources.oxygenSupply
                      ? "active"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      resources.oxygenSupply
                    }
                    onChange={(e) =>
                      handleResourceChange(
                        "oxygenSupply",
                        e.target.checked
                      )
                    }
                  />

                  <span>🫁</span>

                  <div>
                    <strong>
                      Oxygen Supply
                    </strong>

                    <small>
                      Oxygen support required
                    </small>
                  </div>
                </label>

                <label
                  className={`resource-toggle ${
                    resources.bloodBank
                      ? "active"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      resources.bloodBank
                    }
                    onChange={(e) =>
                      handleResourceChange(
                        "bloodBank",
                        e.target.checked
                      )
                    }
                  />

                  <span>🩸</span>

                  <div>
                    <strong>Blood Bank</strong>

                    <small>
                      Blood availability required
                    </small>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ERROR */}

          {(error || speechError) && (
            <div className="emergency-error">
              <span>⚠️</span>

              <p>
                {error ||
                  speechError}
              </p>
            </div>
          )}

          {/* LOCATION INFO */}

          <div className="location-notice">
            <span>📍</span>

            <div>
              <strong>
                Your current location will be shared
              </strong>

              <p>
                This helps us find nearby hospitals
                and coordinate emergency assistance.
              </p>
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="create-emergency-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner" />
                Analyzing Emergency...
              </>
            ) : (
              <>
                🚨 Create Emergency Request
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </section>
    );
  }

  // =========================================
  // EDIT
  // =========================================

  if (step === "edit") {
    return (
      <section className="emergency-card">
        <div className="emergency-card-top">
          <div className="emergency-title">
            <div className="emergency-icon">
              ✏️
            </div>

            <div>
              <h2>Edit Requirements</h2>

              <p>
                Make any changes before confirming
                the emergency.
              </p>
            </div>
          </div>

          <div className="step-badge">
            Step 2 of 3
          </div>
        </div>

        <div className="review-alert">
          <span>ℹ️</span>

          <div>
            <strong>
              Review the AI-generated requirements
            </strong>

            <p>
              You can modify the details before
              sending the request to hospitals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEdit}>
          <div className="emergency-section">
            <div className="form-group">
              <label>
                Emergency Description
              </label>

              <textarea
                className="emergency-textarea"
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                rows={5}
              />
            </div>

            <div className="form-group">
              <label>
                Emergency Type
              </label>

              <select
                className="emergency-select"
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(
                    e.target.value
                  )
                }
              >
                {EMERGENCY_TYPES.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="resource-header">
              <div>
                <h4>Required Resources</h4>

                <p>
                  Adjust the hospital requirements.
                </p>
              </div>
            </div>

            <div className="resource-grid">
              {[
                ["icuBeds", "ICU Beds", "🏥"],
                [
                  "traumaBeds",
                  "Trauma Beds",
                  "🛏️",
                ],
                [
                  "generalBeds",
                  "General Beds",
                  "🛌",
                ],
                [
                  "ventilators",
                  "Ventilators",
                  "💨",
                ],
              ].map(
                ([field, label, icon]) => (
                  <div
                    className="resource-card"
                    key={field}
                  >
                    <div className="resource-icon">
                      {icon}
                    </div>

                    <div className="resource-info">
                      <span>{label}</span>

                      <input
                        type="number"
                        min="0"
                        value={resources[field]}
                        onChange={(e) =>
                          handleResourceChange(
                            field,
                            Number(
                              e.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="resource-toggle-grid">
              <label
                className={`resource-toggle ${
                  resources.oxygenSupply
                    ? "active"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    resources.oxygenSupply
                  }
                  onChange={(e) =>
                    handleResourceChange(
                      "oxygenSupply",
                      e.target.checked
                    )
                  }
                />

                <span>🫁</span>

                <div>
                  <strong>
                    Oxygen Supply
                  </strong>

                  <small>
                    Oxygen support required
                  </small>
                </div>
              </label>

              <label
                className={`resource-toggle ${
                  resources.bloodBank
                    ? "active"
                    : ""
                }`}
              >
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

                <span>🩸</span>

                <div>
                  <strong>Blood Bank</strong>

                  <small>
                    Blood availability required
                  </small>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="emergency-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="emergency-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setStep("review")
              }
              disabled={loading}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save Changes →"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  // =========================================
  // REVIEW
  // =========================================

  if (step === "review") {
    const requirements =
      emergency?.confirmedRequirements ||
      emergency?.aiParsedRequirements;

    const patients =
      requirements?.patients || [];

    const requiredResources =
      requirements?.requiredResources ||
      emptyResources;

    return (
      <section className="emergency-card">
        <div className="emergency-card-top">
          <div className="emergency-title">
            <div className="emergency-icon">
              🔍
            </div>

            <div>
              <h2>Review Emergency</h2>

              <p>
                Verify the information before
                contacting hospitals.
              </p>
            </div>
          </div>

          <div className="step-badge">
            Step 2 of 3
          </div>
        </div>

        <div className="review-alert">
          <span>✓</span>

          <div>
            <strong>
              Emergency request analyzed
            </strong>

            <p>
              Please review the details below.
              You can edit anything before
              confirming.
            </p>
          </div>
        </div>

        {/* EMERGENCY TYPE */}

        <div className="review-main-card">
          <span className="review-label">
            Emergency Type
          </span>

          <h3>
            {getEmergencyLabel(
              requirements?.emergencyType
            )}
          </h3>
        </div>

        {/* DESCRIPTION */}

        <div className="review-section">
          <div className="review-section-title">
            <span>📝</span>
            <h4>Description</h4>
          </div>

          <p className="review-description">
            {requirements?.description ||
              "No description provided."}
          </p>
        </div>

        {/* PATIENTS */}

        <div className="review-section">
          <div className="review-section-title">
            <span>👤</span>

            <h4>
              Patients{" "}
              <span className="count-badge">
                {patients.length}
              </span>
            </h4>
          </div>

          {patients.length === 0 ? (
            <p className="muted-text">
              No patient information detected.
            </p>
          ) : (
            <div className="patient-grid">
              {patients.map(
                (patient, index) => (
                  <div
                    key={index}
                    className="patient-card"
                  >
                    <strong>
                      Patient {index + 1}
                    </strong>

                    <div>
                      <span>
                        Name
                      </span>

                      <p>
                        {patient.name ||
                          "Not provided"}
                      </p>
                    </div>

                    <div>
                      <span>
                        Age
                      </span>

                      <p>
                        {patient.age ??
                          "Not provided"}
                      </p>
                    </div>

                    <div>
                      <span>
                        Gender
                      </span>

                      <p>
                        {patient.gender ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* RESOURCES */}

        <div className="review-section">
          <div className="review-section-title">
            <span>🏥</span>
            <h4>Required Resources</h4>
          </div>

          <div className="review-resource-grid">
            <div>
              <span>ICU Beds</span>
              <strong>
                {requiredResources.icuBeds ||
                  0}
              </strong>
            </div>

            <div>
              <span>Trauma Beds</span>
              <strong>
                {requiredResources.traumaBeds ||
                  0}
              </strong>
            </div>

            <div>
              <span>General Beds</span>
              <strong>
                {requiredResources.generalBeds ||
                  0}
              </strong>
            </div>

            <div>
              <span>Ventilators</span>
              <strong>
                {requiredResources.ventilators ||
                  0}
              </strong>
            </div>

            <div
              className={
                requiredResources.oxygenSupply
                  ? "resource-required"
                  : ""
              }
            >
              <span>Oxygen</span>

              <strong>
                {requiredResources.oxygenSupply
                  ? "Required"
                  : "Not required"}
              </strong>
            </div>

            <div
              className={
                requiredResources.bloodBank
                  ? "resource-required"
                  : ""
              }
            >
              <span>Blood Bank</span>

              <strong>
                {requiredResources.bloodBank
                  ? "Required"
                  : "Not required"}
              </strong>
            </div>
          </div>
        </div>

        {error && (
          <div className="emergency-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* ACTIONS */}

        <div className="emergency-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleEdit}
            disabled={loading}
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            className="danger-outline-button"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirm-button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? "Contacting Hospitals..."
              : "✓ Confirm Emergency"}
          </button>
        </div>
      </section>
    );
  }

  // =========================================
  // CONFIRMED
  // =========================================

  if (step === "confirmed") {
    return (
      <section className="emergency-card">
        <div className="confirmed-header">
          <div className="success-icon">
            ✓
          </div>

          <div>
            <h2>Emergency Confirmed</h2>

            <p>
              Your emergency request has been
              sent to nearby hospitals.
            </p>
          </div>
        </div>

        <div className="hospital-summary">
          <div>
            <span>Hospitals contacted</span>

            <strong>
              {matchedHospitals.length}
            </strong>
          </div>

          <div>
            <span>Status</span>

            <strong className="status-waiting">
              Waiting for response
            </strong>
          </div>
        </div>

        <div className="hospital-section">
          <div className="section-heading">
            <div>
              <h3>Hospital Responses</h3>

              <p>
                Hospitals matching your emergency
                requirements have been contacted.
              </p>
            </div>
          </div>

          {matchedHospitals.length === 0 ? (
            <div className="empty-hospitals">
              <span>🏥</span>

              <strong>
                No hospitals matched yet
              </strong>

              <p>
                The system is still processing
                nearby hospital availability.
              </p>
            </div>
          ) : (
            <div className="hospital-list">
              {matchedHospitals.map(
                (hospital) => (
                  <div
                    key={
                      hospital._id ||
                      hospital.id
                    }
                    className="hospital-card"
                  >
                    <div className="hospital-icon">
                      🏥
                    </div>

                    <div className="hospital-info">
                      <h4>
                        {hospital.name}
                      </h4>

                      <span>
                        {hospital.hospitalId ||
                          "Hospital"}
                      </span>

                      <p>
                        Request sent • Waiting
                        for response
                      </p>
                    </div>

                    <div className="hospital-status">
                      Pending
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="secondary-button full-width"
          onClick={resetCard}
        >
          Create Another Emergency
        </button>
      </section>
    );
  }

  return null;
};

export default EmergencyCard;