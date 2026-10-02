import { ArrowLeft, Save } from "lucide-react";
import { Alert, Button, Field, Input, Select } from "../ui";
import ResourceInputs from "../resources/ResourceInputs";
import { EMERGENCY_TYPES } from "../../config/resources";

/** Step 2b — edit the confirmed requirements (type, patients, resources), then save via PUT. */
export default function EditRequest({
  requirements, loading, error, onTypeChange, onPatientChange, onResourceChange, onSubmit, onBack,
}) {
  const patients = requirements.patients || [];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Emergency type">
        <Select value={requirements.emergencyType || ""} onChange={(e) => onTypeChange(e.target.value)}>
          {EMERGENCY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>

      <Field label={`Patients (${patients.length})`}>
        <div className="space-y-2">
          {patients.length === 0 && <p className="text-body text-ink-muted">No patients detected.</p>}
          {patients.map((patient, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_110px] gap-2">
              <Input placeholder={`Patient ${i + 1} name`} value={patient.name || ""} onChange={(e) => onPatientChange(i, "name", e.target.value)} />
              <Input type="number" min="0" placeholder="Age" value={patient.age ?? ""} onChange={(e) => onPatientChange(i, "age", e.target.value === "" ? null : Number(e.target.value))} />
              <Select value={patient.gender || ""} onChange={(e) => onPatientChange(i, "gender", e.target.value)}>
                <option value="">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          ))}
        </div>
      </Field>

      <Field label="Required resources">
        <ResourceInputs value={requirements.requiredResources} onChange={onResourceChange} />
      </Field>

      <Alert>{error}</Alert>

      <div className="flex gap-2">
        <Button icon={ArrowLeft} disabled={loading} onClick={onBack}>Back</Button>
        <Button type="submit" variant="primary" icon={Save} loading={loading} full>Save changes</Button>
      </div>
    </form>
  );
}
