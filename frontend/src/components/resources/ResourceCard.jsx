import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { ProgressBar } from "../ui/Data";

/**
 * Capacity card for one countable resource (ICU beds, ventilators …).
 * resource = { total, occupied, reserved, available? }
 *
 * variant "dashboard" → read-only overview, with an availability badge
 * variant "inventory" → adds an `action` slot (e.g. an edit button)
 */
export default function ResourceCard({ title, icon: Icon, resource, variant = "dashboard", action }) {
  const { total = 0, occupied = 0, reserved = 0 } = resource || {};
  const available = resource?.available ?? Math.max(0, total - occupied - reserved);
  const isDashboard = variant === "dashboard";

  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-card-muted text-ink-soft">
          <Icon size={18} />
        </span>
        {isDashboard ? (
          <Badge tone={available > 0 ? "primary" : "critical"}>{available > 0 ? "Available" : "Full"}</Badge>
        ) : (
          action
        )}
      </div>

      <p className="mt-5 text-label font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
      <p className="mt-1 text-display font-bold tabular-nums tracking-tight text-ink">
        {available}
        <span className="ml-1.5 text-body font-medium text-ink-muted">{isDashboard ? `/ ${total}` : "available"}</span>
      </p>

      <ProgressBar value={available} max={total} className="mt-4" />

      <div className="mt-4 flex justify-between border-t border-line pt-3 text-caption text-ink-muted">
        {isDashboard ? (
          <>
            <span>Occupied <b className="text-ink">{occupied}</b></span>
            <span>Reserved <b className="text-ink">{reserved}</b></span>
          </>
        ) : (
          <>
            <Stat label="Total" value={total} />
            <Stat label="Occupied" value={occupied} />
            <Stat label="Reserved" value={reserved} />
          </>
        )}
      </div>
    </Card>
  );
}

const Stat = ({ label, value }) => (
  <div>
    <p>{label}</p>
    <p className="text-subtitle font-semibold text-ink">{value}</p>
  </div>
);
