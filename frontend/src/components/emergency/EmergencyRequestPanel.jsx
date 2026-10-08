import { useEffect, useState } from "react";
import { Sparkles, ChevronLeft } from "lucide-react";

import {
  createEmergencyRequest,
  updateEmergencyRequest,
  cancelEmergencyRequest,
  confirmEmergencyRequest,
  getActiveEmergencyRequest,
} from "../../api/emergency.api";

import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { EMPTY_RESOURCES } from "../../config/resources";
import { getErrorMessage } from "../../utils/format";

import { Badge, Card } from "../ui";
import CreateRequestForm from "./CreateRequestForm";
import ReviewRequest from "./ReviewRequest";
import EditRequest from "./EditRequest";
import SearchingRequest from "./SearchingRequest";

import LocationPicker from "../map/LocationPicker";
import socket from "../../socket/socket";

const EMPTY_FORM = {
  description: "",
  emergencyType: "",
  patientCount: "",
  resources: EMPTY_RESOURCES,
};

const STEP_TITLES = {
  form: "Create Emergency Request",
  review: "Review Emergency",
  edit: "Edit Requirements",
  searching: "Dispatching",
};

export default function EmergencyRequestPanel({
  location,
  hospitals = [],
  route,
  onRouteChange,
  onCollapse,
}) {
  const [step, setStep] = useState("form");
  const [request, setRequest] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [editRequirements, setEditRequirements] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Emergency location is independent from
  // live ambulance location.
  const [emergencyLocation, setEmergencyLocation] =
    useState(null);

  const [showLocationPicker, setShowLocationPicker] =
    useState(false);

  useEffect(() => {
    if (!emergencyLocation && location) {
      setEmergencyLocation(location);
    }
  }, [location, emergencyLocation]);

  useEffect(() => {
    const restoreActiveEmergency = async () => {
      try {
        const response =
          await getActiveEmergencyRequest();

        const activeEmergency =
          response.data;

        if (!activeEmergency) {
          return;
        }

        console.log(
          "♻️ Restored active emergency:",
          activeEmergency
        );

        setRequest(activeEmergency);

        if (
          activeEmergency.status === "PARSED"
        ) {
          setStep("review");
        } else if (
          [
            "SEARCHING_HOSPITAL",
            "HOSPITALS_PINGED",
            "HOSPITAL_ASSIGNED",
          ].includes(
            activeEmergency.status
          )
        ) {
          setStep("searching");
        }

        if (
          activeEmergency.assignedHospital
        ) {
          onRouteChange?.(
            activeEmergency.assignedHospital
          );
        }
      } catch (error) {
        console.error(
          "❌ Failed to restore active emergency:",
          error
        );
      }
    };

    restoreActiveEmergency();
  }, [onRouteChange]);

  useEffect(() => {
    const handleEmergencyAssigned = (data) => {
      console.log(
        "🏥 ASSIGNMENT EVENT RECEIVED:",
        data
      );

      const assignedHospital =
        data?.hospital;

      if (!assignedHospital) {
        console.error(
          "❌ emergency:assigned received without hospital:",
          data
        );

        return;
      }

      setRequest((previous) => {
        console.log(
          "📦 Previous emergency state:",
          previous
        );

        if (!previous) {
          console.warn(
            "⚠️ Assignment received but no emergency request exists in UI."
          );

          return previous;
        }

        const updatedRequest = {
          ...previous,
          status: "HOSPITAL_ASSIGNED",
          assignedHospital,
        };

        console.log(
          "✅ Updated emergency state:",
          updatedRequest
        );

        return updatedRequest;
      });

      onRouteChange?.(
        assignedHospital
      );
    };

    const handleNoHospitalAvailable = (
      data
    ) => {
      console.log(
        "❌ NO HOSPITAL AVAILABLE:",
        data
      );

      setRequest((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          status: "NO_HOSPITAL_AVAILABLE",
        };
      });

      onRouteChange?.(null);
    };

    socket.on(
      "emergency:assigned",
      handleEmergencyAssigned
    );

    socket.on(
      "emergency:no-hospital",
      handleNoHospitalAvailable
    );

    return () => {
      socket.off(
        "emergency:assigned",
        handleEmergencyAssigned
      );

      socket.off(
        "emergency:no-hospital",
        handleNoHospitalAvailable
      );
    };
  }, [onRouteChange]);

  const voice =
    useSpeechRecognition();

  // null = follow speech recognition
  // string = user's manual edit
  const [typedTranscript, setTypedTranscript] =
    useState(null);

  const voiceTranscript =
    typedTranscript ?? voice.transcript;

  const toggleVoice = () => {
    if (voice.isListening) {
      return voice.stopListening();
    }

    setTypedTranscript(null);
    voice.clearTranscript();
    voice.startListening();
  };

  const setField = (
    field,
    value
  ) => {
    if (
      field === "voiceTranscript"
    ) {
      return setTypedTranscript(
        value
      );
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const run = async (
    action,
    fallbackMessage
  ) => {
    try {
      setLoading(true);
      setError("");

      await action();
    } catch (err) {
      console.error(
        fallbackMessage,
        err
      );

      setError(
        getErrorMessage(
          err,
          fallbackMessage
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const requireId = () => {
    if (!request?._id) {
      throw new Error(
        "Emergency request ID is missing."
      );
    }
  };

  const handleCreate = (event) => {
    event.preventDefault();

    if (!emergencyLocation) {
      return setError(
        "Please select the emergency location."
      );
    }

    const hasText =
      form.description.trim();

    const hasVoice =
      voiceTranscript.trim();

    const hasResources =
      form.resources.icuBeds > 0 ||
      form.resources.traumaBeds > 0 ||
      form.resources.generalBeds > 0 ||
      form.resources.ventilators > 0 ||
      form.resources.oxygenSupply === true ||
      form.resources.bloodBank === true;

    const hasQuickSelect =
      form.emergencyType ||
      form.patientCount ||
      hasResources;

    if (
      !hasText &&
      !hasVoice &&
      !hasQuickSelect
    ) {
      return setError(
        "Please provide at least one emergency detail."
      );
    }

    run(
      async () => {
        const inputs = {};

        if (
          form.description.trim()
        ) {
          inputs.text =
            form.description.trim();
        }

        if (
          voiceTranscript.trim()
        ) {
          inputs.voiceTranscript =
            voiceTranscript.trim();
        }

        const quickSelect = {};

        if (
          form.emergencyType
        ) {
          quickSelect.emergencyType =
            form.emergencyType;
        }

        if (
          form.patientCount
        ) {
          quickSelect.patientCount =
            Number(form.patientCount);
        }

        if (hasResources) {
          quickSelect.requiredResources =
            form.resources;
        }

        if (
          Object.keys(
            quickSelect
          ).length > 0
        ) {
          inputs.quickSelect =
            quickSelect;
        }

        const payload = {
          inputs,

          location: {
            type: "Point",

            coordinates: [
              emergencyLocation.longitude,
              emergencyLocation.latitude,
            ],
          },
        };

        console.log(
          "🚨 Emergency request payload:",
          payload
        );

        const response =
          await createEmergencyRequest(
            payload
          );

        setRequest(
          response.data
        );

        setStep("review");
      },
      "Unable to create emergency request."
    );
  };

  const handleStartEdit = () => {
    const requirements =
      request?.confirmedRequirements ||
      request?.aiParsedRequirements;

    if (!requirements) {
      return setError(
        "No confirmed requirements are available."
      );
    }

    setEditRequirements(
      structuredClone(requirements)
    );

    setError("");
    setStep("edit");
  };

  const handleEditType = (
    value
  ) => {
    setEditRequirements(
      (prev) => ({
        ...prev,
        emergencyType: value,
      })
    );
  };

  const handleEditPatient = (
    index,
    field,
    value
  ) => {
    setEditRequirements(
      (prev) => {
        const patients = [
          ...(prev?.patients || []),
        ];

        patients[index] = {
          ...patients[index],
          [field]: value,
        };

        return {
          ...prev,
          patients,
        };
      }
    );
  };

  const handleEditResource = (
    field,
    value
  ) => {
    setEditRequirements(
      (prev) => ({
        ...prev,

        requiredResources: {
          ...(prev?.requiredResources || {}),
          [field]: value,
        },
      })
    );
  };

  const handleSaveEdit = (
    event
  ) => {
    event.preventDefault();

    run(
      async () => {
        requireId();

        const response =
          await updateEmergencyRequest(
            request._id,
            {
              confirmedRequirements:
                editRequirements,
            }
          );

        setRequest(
          response.data
        );

        setEditRequirements(null);
        setStep("review");
      },
      "Unable to update emergency requirements."
    );
  };

  const handleCancel = () =>
    run(
      async () => {
        requireId();

        await cancelEmergencyRequest(
          request._id
        );

        reset();
      },
      "Unable to cancel emergency request."
    );

  const handleConfirm = () =>
    run(
      async () => {
        requireId();

        const response =
          await confirmEmergencyRequest(
            request._id
          );

        setRequest(
          response.data.emergency
        );

        setStep("searching");
      },
      "Unable to confirm emergency request."
    );

  const handleHandoverComplete = (
    completedEmergency
  ) => {
    setRequest(
      completedEmergency
    );

    onRouteChange?.(
      null
    );
  };

  const reset = () => {
    setRequest(null);

    setEditRequirements(null);

    setForm({
      ...EMPTY_FORM,

      resources: {
        ...EMPTY_RESOURCES,
      },
    });

    setTypedTranscript(null);
    voice.clearTranscript();
    setError("");

    setEmergencyLocation(
      location || null
    );

    onRouteChange?.(
      null
    );

    setStep("form");
  };

  return (
    <>
      <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="flex min-w-0 items-center gap-2.5 text-subtitle font-semibold text-ink">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/30" />

            <span className="truncate">
              {STEP_TITLES[step]}
            </span>
          </h2>

          {onCollapse && (
            <button
              type="button"
              aria-label="Collapse emergency request panel"
              onClick={onCollapse}
              className="
                grid h-9 w-9 shrink-0
                place-items-center
                rounded-field
                border border-line
                bg-card
                text-ink-muted
                transition-all duration-200
                hover:bg-card-muted
                hover:text-ink
                active:scale-95
              "
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-hidden p-5">

          {step === "form" && (
            <CreateRequestForm
              values={{
                ...form,
                voiceTranscript,
              }}
              onChange={setField}
              location={emergencyLocation}
              loading={loading}
              error={error}
              onSubmit={handleCreate}
              onReset={reset}
              voice={{
                isListening:
                  voice.isListening,

                error:
                  voice.error,

                toggle:
                  toggleVoice,
              }}
              onOpenLocationPicker={() =>
                setShowLocationPicker(
                  true
                )
              }
            />
          )}

          {step === "review" && (
            <ReviewRequest
              request={request}
              loading={loading}
              error={error}
              onEdit={handleStartEdit}
              onCancel={handleCancel}
              onConfirm={handleConfirm}
            />
          )}

          {step === "edit" && (
            <EditRequest
              request={request}
              requirements={
                editRequirements
              }
              loading={loading}
              error={error}
              onTypeChange={
                handleEditType
              }
              onPatientChange={
                handleEditPatient
              }
              onResourceChange={
                handleEditResource
              }
              onSubmit={
                handleSaveEdit
              }
              onBack={() => {
                setEditRequirements(
                  null
                );

                setError("");

                setStep("review");
              }}
            />
          )}

          {step === "searching" && (
            <SearchingRequest
              request={request}
              hospitals={hospitals}
              location={location}
              route={route}
              onHandoverComplete={
                handleHandoverComplete
              }
              onReset={reset}
              onCancel={handleCancel}
            />
          )}

        </div>
      </Card>

      <LocationPicker
        open={
          showLocationPicker
        }
        initialLocation={
          emergencyLocation
        }
        onConfirm={(
          selectedLocation
        ) => {
          setEmergencyLocation(
            selectedLocation
          );

          setShowLocationPicker(
            false
          );
        }}
        onClose={() =>
          setShowLocationPicker(
            false
          )
        }
      />
    </>
  );
}
