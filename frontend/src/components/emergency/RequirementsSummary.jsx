import { Check, Minus } from "lucide-react";
import Badge from "../ui/Badge";
import { COUNTABLE_RESOURCES, CRITICAL_RESOURCES } from "../../config/resources";
import { formatLabel } from "../../utils/format";

/**
 * Read-only view of an emergency's requirements (the AI-parsed / confirmed object).
 * Shared by: ambulance review step, ambulance request details, hospital request details.
 */
export default function RequirementsSummary({ requirements }) {
  if (!requirements) return <p className="text-body text-ink-muted">No requirements available.</p>;
  const patients = requirements.patients || [];
  const resources = requirements.requiredResources || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-card bg-card-dark px-4 py-3.5 text-on-dark">
        <div>
          <p className="text-label uppercase tracking-wider text-on-dark-muted">Emergency type</p>
          <p className="text-subtitle font-semibold">{formatLabel(requirements.emergencyType) || "—"}</p>
        </div>
        <Badge tone="accent">AI parsed</Badge>
      </div>

      {requirements.description && (
        <Section title="What happened">
          <p className="rounded-field bg-card-muted p-3.5 text-body leading-5 text-ink-soft">{requirements.description}</p>
        </Section>
      )}

      <Section title="Patients" count={patients.length}>
        {patients.length === 0 ? (
          <p className="text-body text-ink-muted">No patient details extracted.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {patients.map((p, i) => (
              <div key={i} className="rounded-field border border-line bg-card-muted px-3.5 py-2.5">
                <p className="text-body font-semibold text-ink">{p.name || `Patient ${i + 1}`}</p>
                <p className="text-caption text-ink-muted">
                  {p.age != null ? `${p.age} years` : "Age unknown"}
                  {p.gender ? ` · ${formatLabel(p.gender)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Required resources">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COUNTABLE_RESOURCES.map(({ key, label }) => (
            <ResourceCell key={key} label={label} on={resources[key] > 0} text={resources[key] ?? 0} />
          ))}
          {CRITICAL_RESOURCES.map(({ key, label }) => (
            <ResourceCell key={key} label={label} on={!!resources[key]} text={resources[key] ? "Required" : "Not needed"} icon />
          ))}
        </div>
      </Section>
    </div>
  );
}

const Section = ({ title, count, children }) => (
  <div>
    <h3 className="mb-2 flex items-center gap-2 text-label font-semibold uppercase tracking-wider text-ink-muted">
      {title}
      {count != null && <span className="rounded-full bg-workspace px-2 py-0.5 text-ink-soft">{count}</span>}
    </h3>
    {children}
  </div>
);

const ResourceCell = ({ label, on, text, icon }) => (
  <div className={`rounded-field px-3.5 py-2.5 ${on ? "bg-primary-soft" : "bg-card-muted"}`}>
    <p className="text-caption text-ink-muted">{label}</p>
    <p className={`flex items-center gap-1 text-body font-semibold ${on ? "text-primary-strong" : "text-ink-muted"}`}>
      {icon && (on ? <Check size={14} /> : <Minus size={14} />)}
      {text}
    </p>
  </div>
);
