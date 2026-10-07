import { Check, Minus, UserRound } from "lucide-react";
import Badge from "../ui/Badge";
import {
  COUNTABLE_RESOURCES,
  CRITICAL_RESOURCES,
} from "../../config/resources";
import { formatLabel } from "../../utils/format";

export default function RequirementsSummary({ requirements }) {
  if (!requirements) {
    return (
      <p className="text-body text-ink-muted">
        No requirements available.
      </p>
    );
  }

  const patients = requirements.patients || [];
  const resources = requirements.requiredResources || {};

  return (
    <div className="space-y-6">

      {/* Emergency type */}
      <section>
        <h3 className="mb-2 text-label font-semibold uppercase tracking-wider text-ink-muted">
          Emergency Type
        </h3>

        <div className="rounded-card border border-line bg-card-muted px-4 py-3.5">
          <p className="text-subtitle font-semibold text-ink">
            {formatLabel(requirements.emergencyType) || "—"}
          </p>
        </div>
      </section>

      {/* What happened */}
      {requirements.description && (
        <section>
          <SectionTitle title="Emergency Details" />

          <div className="rounded-card bg-card-muted px-4 py-3.5">
            <p className="text-body leading-5 text-ink-soft">
              {requirements.description}
            </p>
          </div>
        </section>
      )}

      {/* Patients */}
      <section>
        <SectionTitle
          title="Patients"
          count={patients.length}
        />

        {patients.length === 0 ? (
          <div className="rounded-card bg-card-muted px-4 py-3">
            <p className="text-body text-ink-muted">
              No patient details extracted.
            </p>
          </div>
        ) : (
          <div className="space-y-2">

            {patients.map((patient, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-card border border-line bg-card px-3.5 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <UserRound size={15} />
                </div>

                <div className="min-w-0">
                  <p className="text-body font-semibold text-ink">
                    {patient.name || `Patient ${index + 1}`}
                  </p>

                  <p className="text-caption text-ink-muted">
                    {patient.age != null
                      ? `${patient.age} years`
                      : "Age unknown"}

                    {patient.gender
                      ? ` · ${formatLabel(patient.gender)}`
                      : ""}
                  </p>
                </div>
              </div>
            ))}

          </div>
        )}
      </section>

      {/* Required resources */}
      <section>
        <SectionTitle title="Required Resources" />

        <div className="space-y-1.5">

          {COUNTABLE_RESOURCES.map(({ key, label }) => (
            <ResourceRow
              key={key}
              label={label}
              value={resources[key] ?? 0}
              active={resources[key] > 0}
            />
          ))}

          {CRITICAL_RESOURCES.map(({ key, label }) => (
            <ResourceRow
              key={key}
              label={label}
              value={resources[key] ? "Required" : "Not needed"}
              active={Boolean(resources[key])}
              criticalResource
            />
          ))}

        </div>
      </section>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Section title                                                              */
/* -------------------------------------------------------------------------- */

function SectionTitle({ title, count }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-label font-semibold uppercase tracking-wider text-ink-muted">
      {title}

      {count != null && (
        <span className="rounded-full bg-workspace px-2 py-0.5 text-caption font-medium text-ink-soft">
          {count}
        </span>
      )}
    </h3>
  );
}


/* -------------------------------------------------------------------------- */
/* Resource row                                                               */
/* -------------------------------------------------------------------------- */

function ResourceRow({
  label,
  value,
  active,
  criticalResource = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-field px-3.5 py-2.5 ${active
          ? "bg-primary-soft"
          : "bg-card-muted"
        }`}
    >

      <span className="text-body text-ink-soft">
        {label}
      </span>

      <span
        className={`flex items-center gap-1.5 text-body font-semibold ${active
            ? "text-primary-strong"
            : "text-ink-muted"
          }`}
      >

        {criticalResource &&
          (active ? (
            <Check size={14} strokeWidth={2.5} />
          ) : (
            <Minus size={14} />
          ))}

        {value}

      </span>

    </div>
  );
}