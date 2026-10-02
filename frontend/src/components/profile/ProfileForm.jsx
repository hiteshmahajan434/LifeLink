import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { Alert, Badge, Button, Card, Field, Input } from "../ui";
import { getErrorMessage } from "../../utils/format";

/**
 * Generic "edit my details" card — the ambulance and hospital profile pages
 * only differ by the `fields` config they pass in.
 *
 *   fields: [{ name, label, wide? }]      idLabel/idValue: the locked identifier
 *   onSave(values) → Promise              throws on failure
 */
export default function ProfileForm({ icon: Icon, title, subtitle, idLabel, idValue, fields, initialValues, footnote, onSave }) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await onSave(values);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-3 border-b border-line pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-field bg-primary text-on-primary"><Icon size={20} /></span>
            <div>
              <h2 className="text-subtitle font-semibold text-ink">{title}</h2>
              <p className="text-caption text-ink-muted">{subtitle}</p>
            </div>
          </div>
          <Badge tone="primary" dot>Active</Badge>
        </div>

        <div className="mt-5 space-y-4">
          <Field label={idLabel}>
            <div className="relative">
              <Input value={idValue || ""} readOnly className="pr-20" />
              <span className="absolute right-3.5 top-3 flex items-center gap-1 text-caption text-ink-muted"><Lock size={12} /> Locked</span>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.name} label={f.label} className={f.wide ? "sm:col-span-2" : ""}>
                <Input value={values[f.name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
              </Field>
            ))}
          </div>

          <Alert>{error}</Alert>
          <Alert tone="success">{message}</Alert>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-caption text-ink-muted">{footnote}</p>
          <Button type="submit" variant="primary" icon={Save} loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}
