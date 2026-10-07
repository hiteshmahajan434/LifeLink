import { ArrowLeft, Save, UserRound, Sparkles } from "lucide-react";
import { Alert, Badge, Button, Field, Input, Select } from "../ui";
import ResourceInputs from "../resources/ResourceInputs";
import { EMERGENCY_TYPES } from "../../config/resources";

/**
 * Step 2b — edit the AI-parsed / confirmed requirements.
 * Edit emergency type, patient details and required resources,
 * then save via PUT.
 */
export default function EditRequest({
  request,
  requirements,
  loading,
  error,
  onTypeChange,
  onPatientChange,
  onResourceChange,
  onSubmit,
  onBack,
}) {
  const patients = requirements.patients || [];

  return (
    <form
      onSubmit={onSubmit}
      className="flex h-full min-h-0 flex-col"
    >
      {/* =========================================================
          FIXED TOP INFORMATION
          ========================================================= */}
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


      {/* =========================================================
          SCROLLABLE CONTENT
          ========================================================= */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
        <div className="space-y-5">

          {/* -----------------------------------------------------
              Emergency Type
              ----------------------------------------------------- */}
          <section className="rounded-card border border-line bg-card-muted p-4">
            <Field label="Emergency type">

              <Select
                value={requirements.emergencyType || ""}
                onChange={(e) =>
                  onTypeChange(e.target.value)
                }
              >
                <option value="">
                  Select emergency type
                </option>

                {EMERGENCY_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </Select>

            </Field>
          </section>


          {/* -----------------------------------------------------
              Patients
              ----------------------------------------------------- */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-label font-semibold uppercase tracking-wider text-ink-muted">
                Patients
              </h3>

              <span className="rounded-full bg-workspace px-2 py-0.5 text-caption font-medium text-ink-soft">
                {patients.length}
              </span>
            </div>

            {patients.length === 0 ? (
              <div className="rounded-card bg-card-muted px-4 py-3">
                <p className="text-body text-ink-muted">
                  No patients detected.
                </p>
              </div>
            ) : (
              <div className="space-y-3">

                {patients.map((patient, index) => (
                  <div
                    key={index}
                    className="rounded-card border border-line bg-card p-3.5"
                  >
                    {/* Patient heading */}
                    <div className="mb-3 flex items-center gap-2">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                        <UserRound size={15} />
                      </div>

                      <div>
                        <p className="text-body font-semibold text-ink">
                          {patient.name ||
                            `Patient ${index + 1}`}
                        </p>

                        <p className="text-caption text-ink-muted">
                          Patient details
                        </p>
                      </div>

                    </div>

                    {/* Patient fields */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_80px_110px]">

                      <Input
                        placeholder={`Patient ${index + 1} name`}
                        value={patient.name || ""}
                        onChange={(e) =>
                          onPatientChange(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                      />

                      <Input
                        type="number"
                        min="0"
                        placeholder="Age"
                        value={patient.age ?? ""}
                        onChange={(e) =>
                          onPatientChange(
                            index,
                            "age",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value)
                          )
                        }
                      />

                      <Select
                        value={patient.gender || ""}
                        onChange={(e) =>
                          onPatientChange(
                            index,
                            "gender",
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          Gender
                        </option>

                        <option value="MALE">
                          Male
                        </option>

                        <option value="FEMALE">
                          Female
                        </option>

                        <option value="OTHER">
                          Other
                        </option>
                      </Select>

                    </div>
                  </div>
                ))}

              </div>
            )}
          </section>


          {/* -----------------------------------------------------
              Required Resources
              ----------------------------------------------------- */}
          <section className="rounded-card border border-line bg-card-muted p-4">
            <Field label="Required resources">

              <ResourceInputs
                value={requirements.requiredResources}
                onChange={onResourceChange}
              />

            </Field>
          </section>


          {/* Error */}
          {error && (
            <Alert>
              {error}
            </Alert>
          )}

        </div>
      </div>


      {/* =========================================================
          FIXED ACTION FOOTER
          ========================================================= */}
      <div className="shrink-0 border-t border-line bg-card pt-4">

        <div className="flex gap-2">

          <Button
            type="button"
            icon={ArrowLeft}
            disabled={loading}
            onClick={onBack}
          >
            Back
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
            full
          >
            Save Changes
          </Button>

        </div>

      </div>

    </form>
  );
}