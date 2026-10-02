import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Alert, Button, Card, Field, Input } from "../ui";
import { getErrorMessage } from "../../utils/format";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Change-password card. onSubmit({ currentPassword, newPassword }) → Promise. */
export default function PasswordForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const change = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.newPassword.length < 6) return setError("New password must be at least 6 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("New passwords do not match.");

    setSaving(true);
    try {
      await onSubmit({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY);
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to change password."));
    } finally {
      setSaving(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <span className="grid h-11 w-11 place-items-center rounded-field bg-accent text-ink"><Lock size={20} /></span>
          <div>
            <h2 className="text-subtitle font-semibold text-ink">Change Password</h2>
            <p className="text-caption text-ink-muted">Protect access to emergency dispatch protocols.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Current password"><Input type={type} value={form.currentPassword} onChange={change("currentPassword")} autoComplete="current-password" required /></Field>
          <Field label="New password" hint="At least 6 characters."><Input type={type} value={form.newPassword} onChange={change("newPassword")} autoComplete="new-password" required /></Field>
          <Field label="Confirm new password"><Input type={type} value={form.confirmPassword} onChange={change("confirmPassword")} autoComplete="new-password" required /></Field>
          <Alert>{error}</Alert>
          <Alert tone="success">{message}</Alert>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <Button size="sm" variant="ghost" icon={show ? EyeOff : Eye} onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</Button>
          <Button type="submit" variant="dark" loading={saving}>Update Password</Button>
        </div>
      </form>
    </Card>
  );
}
