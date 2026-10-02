import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  createEmergencyRequest, updateEmergencyRequest, cancelEmergencyRequest, confirmEmergencyRequest,
} from "../../api/emergency.api";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { EMPTY_RESOURCES } from "../../config/resources";
import { getErrorMessage } from "../../utils/format";
import { Badge, Card } from "../ui";
import CreateRequestForm from "./CreateRequestForm";
import ReviewRequest from "./ReviewRequest";
import EditRequest from "./EditRequest";
import SearchingRequest from "./SearchingRequest";

const EMPTY_FORM = {
  description: "", emergencyType: "", patientCount: 1, resources: EMPTY_RESOURCES,
};

const STEP_TITLES = {
  form: "Create Emergency Request",
  review: "Review Emergency",
  edit: "Edit Requirements",
  searching: "Dispatching",
};

/**
 * The emergency-request flow (controller). Same backend contract as before:
 *
 *   form ──POST /emergency──▶ review ──PUT /emergency/:id──▶ (edit ↔ review)
 *   review ──POST /emergency/:id/confirm──▶ searching
 *   review ──DELETE /emergency/:id──▶ form
 *
 * Steps are rendered by CreateRequestForm / ReviewRequest / EditRequest / SearchingRequest.
 */
export default function EmergencyRequestPanel({ location, hospitals = [], onRouteChange }) {
  const [step, setStep] = useState("form");
  const [request, setRequest] = useState(null);        // request object returned by the backend
  const [form, setForm] = useState(EMPTY_FORM);        // create-form values (POST only)
  const [editRequirements, setEditRequirements] = useState(null); // editable copy for PUT
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const voice = useSpeechRecognition();

  // Voice transcript: shows the live dictation until the user edits the text by hand.
  // null = "follow the dictation", a string = "the user's own edit".
  const [typedTranscript, setTypedTranscript] = useState(null);
  const voiceTranscript = typedTranscript ?? voice.transcript;

  const toggleVoice = () => {
    if (voice.isListening) return voice.stopListening();
    setTypedTranscript(null);
    voice.clearTranscript();
    voice.startListening();
  };

  const setField = (field, value) => {
    if (field === "voiceTranscript") return setTypedTranscript(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Run an async action with shared loading / error handling
  const run = async (action, fallbackMessage) => {
    try {
      setLoading(true);
      setError("");
      await action();
    } catch (err) {
      console.error(fallbackMessage, err);
      setError(getErrorMessage(err, fallbackMessage));
    } finally {
      setLoading(false);
    }
  };

  const requireId = () => {
    if (!request?._id) throw new Error("Emergency request ID is missing.");
  };

  // ---------------------------------------------------------------- CREATE
  const handleCreate = (event) => {
    event.preventDefault();
    if (!location) return setError("Current location is not available yet.");
    if (!form.description.trim() && !voiceTranscript.trim() && !form.emergencyType) {
      return setError("Please describe the emergency or select an emergency type.");
    }

    run(async () => {
      const payload = {
        inputs: {
          ...(form.description.trim() && { text: form.description.trim() }),
          ...(voiceTranscript.trim() && { voiceTranscript: voiceTranscript.trim() }),
          quickSelect: {
            emergencyType: form.emergencyType,
            patientCount: form.patientCount,
            requiredResources: form.resources,
          },
        },
        location: { type: "Point", coordinates: [location.longitude, location.latitude] },
      };
      const response = await createEmergencyRequest(payload);
      setRequest(response.data);
      setStep("review");
    }, "Unable to create emergency request.");
  };

  // ------------------------------------------------------------------ EDIT
  const handleStartEdit = () => {
    const requirements = request?.confirmedRequirements || request?.aiParsedRequirements;
    if (!requirements) return setError("No confirmed requirements are available.");
    // We edit confirmedRequirements only (never request.inputs), on an independent copy.
    setEditRequirements(structuredClone(requirements));
    setError("");
    setStep("edit");
  };

  const handleEditType = (value) => setEditRequirements((prev) => ({ ...prev, emergencyType: value }));

  const handleEditPatient = (index, field, value) =>
    setEditRequirements((prev) => {
      const patients = [...(prev?.patients || [])];
      patients[index] = { ...patients[index], [field]: value };
      return { ...prev, patients };
    });

  const handleEditResource = (field, value) =>
    setEditRequirements((prev) => ({
      ...prev,
      requiredResources: { ...(prev?.requiredResources || {}), [field]: value },
    }));

  const handleSaveEdit = (event) => {
    event.preventDefault();
    run(async () => {
      requireId();
      // PUT /api/emergency/:id  { confirmedRequirements }
      const response = await updateEmergencyRequest(request._id, { confirmedRequirements: editRequirements });
      setRequest(response.data);
      setEditRequirements(null);
      setStep("review");
    }, "Unable to update emergency requirements.");
  };

  // --------------------------------------------------------- CANCEL / CONFIRM
  const handleCancel = () =>
    run(async () => {
      requireId();
      await cancelEmergencyRequest(request._id);
      reset();
    }, "Unable to cancel emergency request.");

  const handleConfirm = () =>
    run(async () => {
      requireId();
      const response = await confirmEmergencyRequest(request._id); // hospital matching starts
      setRequest(response.data);
      setStep("searching");
    }, "Unable to confirm emergency request.");

  const reset = () => {
    setRequest(null);
    setEditRequirements(null);
    setForm(EMPTY_FORM);
    setTypedTranscript(null);
    voice.clearTranscript();
    setError("");
    onRouteChange?.(null);
    setStep("form");
  };

  // ---------------------------------------------------------------- RENDER
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="flex min-w-0 items-center gap-2.5 text-subtitle font-semibold text-ink">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/30" />
          <span className="truncate">{STEP_TITLES[step]}</span>
        </h2>
        <Badge tone="accent" className="whitespace-nowrap"><Sparkles size={12} /> <span className="hidden sm:inline">Auto-Dispatch</span> AI</Badge>
      </div>

      <div className="p-5">
        {step === "form" && (
          <CreateRequestForm
            values={{ ...form, voiceTranscript }}
            onChange={setField}
            location={location}
            loading={loading}
            error={error}
            onSubmit={handleCreate}
            onReset={reset}
            voice={{ isListening: voice.isListening, error: voice.error, toggle: toggleVoice }}
          />
        )}
        {step === "review" && (
          <ReviewRequest request={request} loading={loading} error={error}
            onEdit={handleStartEdit} onCancel={handleCancel} onConfirm={handleConfirm} />
        )}
        {step === "edit" && (
          <EditRequest requirements={editRequirements} loading={loading} error={error}
            onTypeChange={handleEditType} onPatientChange={handleEditPatient} onResourceChange={handleEditResource}
            onSubmit={handleSaveEdit} onBack={() => { setEditRequirements(null); setError(""); setStep("review"); }} />
        )}
        {step === "searching" && (
          <SearchingRequest request={request} hospitals={hospitals} onAssigned={onRouteChange} onReset={reset} />
        )}
      </div>
    </Card>
  );
}
