import { Check, Pencil, X } from "lucide-react";
import { Alert, Badge, Button } from "../ui";
import RequirementsSummary from "./RequirementsSummary";

/** Step 2 — the AI-parsed requirements. Edit them, cancel, or confirm to start hospital matching. */
export default function ReviewRequest({ request, loading, error, onEdit, onCancel, onConfirm }) {
  const requirements = request.confirmedRequirements || request.aiParsedRequirements;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone="accent">Emergency #{request.id}</Badge>
        <span className="text-caption text-ink-muted">Review before dispatch</span>
      </div>

      <RequirementsSummary requirements={requirements} />
      <Alert>{error}</Alert>

      <div className="flex gap-2">
        <Button variant="danger" icon={X} disabled={loading} onClick={onCancel}>Cancel</Button>
        <Button icon={Pencil} disabled={loading} onClick={onEdit}>Edit</Button>
        <Button variant="primary" icon={Check} loading={loading} full onClick={onConfirm}>Confirm & find hospital</Button>
      </div>
    </div>
  );
}
