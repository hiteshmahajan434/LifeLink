import { ArrowRight, LoaderCircle, MapPin, Mic } from "lucide-react";
import { Alert, Button, ChipGroup, Field, Select, Textarea } from "../ui";
import ResourceInputs from "../resources/ResourceInputs";
import { EMERGENCY_TYPES } from "../../config/resources";
import { cn } from "../../utils/cn";

/**
 * Step 1 — describe the emergency.
 * A "controlled" form: the parent panel owns the values, this only renders them.
 */
export default function CreateRequestForm({
  values,
  onChange,
  location,
  loading,
  error,
  onSubmit,
  onReset,
  voice,
  onOpenLocationPicker,
}) {
  const set = (field) => (value) => onChange(field, value);

  return (
    <form
      onSubmit={onSubmit}
      className="flex h-full min-h-0 flex-col"
    >
      {/* =========================================================
          SCROLLABLE FORM CONTENT
          ========================================================= */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="space-y-5">

          {/* Emergency information */}
          <section className="space-y-4 rounded-[18px] border border-line bg-card-muted p-4">
            <Field label="Emergency description">
              <Textarea
                rows={3}
                value={values.description}
                onChange={(e) =>
                  set("description")(e.target.value)
                }
                placeholder="e.g. Two-vehicle collision on the expressway, multiple injuries, driver trapped…"
                className="min-h-[96px]"
              />
            </Field>

            <Field
              label="Voice transcript"
              aside={
                voice.isListening && (
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-strong">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-strong" />
                    Live transcribing
                  </span>
                )
              }
              hint={voice.error}
            >
              <div className="relative">
                <Textarea
                  rows={2}
                  value={values.voiceTranscript}
                  onChange={(e) =>
                    set("voiceTranscript")(e.target.value)
                  }
                  placeholder="Tap the mic and describe the emergency…"
                  className="min-h-[80px] pr-14"
                />

                <button
                  type="button"
                  onClick={voice.toggle}
                  aria-label={
                    voice.isListening
                      ? "Stop voice input"
                      : "Start voice input"
                  }
                  className={cn(
                    "absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full transition",
                    voice.isListening
                      ? "animate-pulse bg-critical text-white"
                      : "bg-accent-soft text-ink hover:bg-accent"
                  )}
                >
                  <Mic size={16} />
                </button>
              </div>
            </Field>
          </section>

          {/* Emergency type */}
          <section className="space-y-4 rounded-[18px] border border-line bg-card-muted p-4">
            <Field label="Emergency type">
              <Select
                value={values.emergencyType}
                onChange={(e) =>
                  set("emergencyType")(e.target.value)
                }
              >
                <option value="">
                  Select emergency type
                </option>

                {EMERGENCY_TYPES.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                  >
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </section>

          {/* Number of patients */}
          <section className="space-y-4 rounded-[18px] border border-line bg-card-muted p-4">
            <Field label="Number of patients">
              <ChipGroup
                value={values.patientCount}
                onChange={set("patientCount")}
                allowToggle
                options={[1, 2, 3, 4, 5].map((n) => ({
                  value: n,
                  label: String(n),
                }))}
              />
            </Field>
          </section>

          {/* Required resources */}
          <section className="space-y-4 rounded-[18px] border border-line bg-card-muted p-4">
            <Field label="Required resources">
              <ResourceInputs
                value={values.resources}
                onChange={(key, v) =>
                  onChange("resources", {
                    ...values.resources,
                    [key]: v,
                  })
                }
              />
            </Field>
          </section>

          {/* Emergency location */}
          <section className="rounded-[18px] border border-line bg-card-muted p-4">
            <Field label="Emergency location">
              <div className="flex items-center gap-3 rounded-[12px] border border-line bg-card px-3.5 py-3">

                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent-strong">
                  <MapPin size={16} />
                </span>

                <p className="min-w-0 flex-1 font-mono text-[11px] text-ink-soft">
                  {location
                    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                    : "Select location"}
                </p>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onOpenLocationPicker}
                >
                  Change
                </Button>

              </div>
            </Field>
          </section>

          {/* Error */}
          {error && <Alert>{error}</Alert>}

        </div>
      </div>

      {/* =========================================================
          FIXED ACTION FOOTER
          ========================================================= */}
      <div className="shrink-0 border-t border-line bg-card pt-4">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <Button
            type="submit"
            variant="primary"
            size="md"
            full
            disabled={loading}
            icon={loading ? LoaderCircle : ArrowRight}
            className={cn(
              loading && "[&>svg]:animate-spin",
              "sm:w-auto"
            )}
          >
            {loading
              ? "Creating request…"
              : "Create Emergency Request"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onReset}
            className="sm:min-w-[120px]"
          >
            Reset form
          </Button>

        </div>
      </div>

    </form>
  );
}