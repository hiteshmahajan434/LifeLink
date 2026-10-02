import Badge from "../ui/Badge";
import { Toggle } from "../ui/Controls";

/**
 * One on/off resource (oxygen, blood bank).
 * Pass `onToggle` to make it editable (inventory); omit it for a read-only badge (dashboard).
 */
export default function CriticalResourceRow({ icon: Icon, title, description, available, onToggle, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-card-muted p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-ink">{title}</p>
          {description && <p className="text-caption text-ink-muted">{description}</p>}
        </div>
      </div>
      {onToggle ? (
        <Toggle checked={!!available} onChange={onToggle} label={title} disabled={disabled} />
      ) : (
        <Badge tone={available ? "primary" : "critical"}>{available ? "Available" : "Unavailable"}</Badge>
      )}
    </div>
  );
}
