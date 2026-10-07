import { Check, Pencil, X, Sparkles } from "lucide-react";
import { Alert, Badge, Button } from "../ui";
import RequirementsSummary from "./RequirementsSummary";

/**
 * Step 2 — the AI-parsed requirements.
 * Edit them, cancel, or confirm to start hospital matching.
 */
export default function ReviewRequest({
  request,
  loading,
  error,
  onEdit,
  onCancel,
  onConfirm,
}) {
  const requirements =
    request.confirmedRequirements || request.aiParsedRequirements;

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* ---------------------------------------------------------- */}
      {/* TOP INFORMATION — fixed                                   */}
      {/* ---------------------------------------------------------- */}

      <div className="shrink-0 pb-4">

        <div className="flex items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <Badge tone="accent">
              Emergency #{request.id}
            </Badge>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-caption font-semibold text-accent-strong">
            <Sparkles size={13} />
            AI Parsed
          </div>

        </div>

      </div>


      {/* ---------------------------------------------------------- */}
      {/* SCROLLABLE REQUIREMENTS — ONLY THIS PART SCROLLS           */}
      {/* ---------------------------------------------------------- */}

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pr-1 pb-4">

        <RequirementsSummary requirements={requirements} />

        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}

      </div>


      {/* ---------------------------------------------------------- */}
      {/* FIXED ACTION FOOTER                                        */}
      {/* ---------------------------------------------------------- */}

      <div className="shrink-0 border-t border-line bg-card pt-4">

        <div className="flex gap-2">

          <Button
            variant="danger"
            icon={X}
            disabled={loading}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            icon={Pencil}
            disabled={loading}
            onClick={onEdit}
          >
            Edit
          </Button>

          <Button
            variant="primary"
            icon={Check}
            loading={loading}
            full
            onClick={onConfirm}
          >
            Confirm & Find Hospitals
          </Button>

        </div>

      </div>

    </div>
  );
}