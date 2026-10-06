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
  values, onChange, location, loading, error, onSubmit, onReset, voice, onOpenLocationPicker,
}) {
  const set = (field) => (value) => onChange(field, value);
  const sectionTitle = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8F]";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="space-y-4 rounded-[18px] border border-[#E1E1E1] bg-[#F8F8F8] p-4">
        <Field label="Emergency description">
          <Textarea
            rows={3}
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="e.g. Two-vehicle collision on the expressway, multiple injuries, driver trapped…"
            className="min-h-[96px]"
          />
        </Field>

        <Field
          label="Voice transcript"
          aside={voice.isListening && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5F4FC9]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5F4FC9]" /> Live transcribing
            </span>
          )}
          hint={voice.error}
        >
          <div className="relative">
            <Textarea
              rows={2}
              value={values.voiceTranscript}
              onChange={(e) => set("voiceTranscript")(e.target.value)}
              placeholder="Tap the mic and describe the emergency…"
              className="min-h-[80px] pr-14"
            />
            <button
              type="button"
              onClick={voice.toggle}
              aria-label={voice.isListening ? "Stop voice input" : "Start voice input"}
              className={cn(
                "absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full transition",
                voice.isListening ? "animate-pulse bg-[#EF5350] text-white" : "bg-[#E9E4FF] text-[#151515] hover:bg-[#D9D1FF]"
              )}
            >
              <Mic size={16} />
            </button>
          </div>
        </Field>
      </section>

      <section className="space-y-4 rounded-[18px] border border-[#E1E1E1] bg-[#F8F8F8] p-4">
        <Field label="Emergency type">
          <Select value={values.emergencyType} onChange={(e) => set("emergencyType")(e.target.value)}>
            <option value="">Select emergency type</option>
            {EMERGENCY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
      </section>

      <section className="space-y-4 rounded-[18px] border border-[#E1E1E1] bg-[#F8F8F8] p-4">
        <Field label="Number of patients">
          <ChipGroup
            value={values.patientCount}
            onChange={set("patientCount")}
            allowToggle
            options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-[18px] border border-[#E1E1E1] bg-[#F8F8F8] p-4">
        <Field label="Required resources">
          <ResourceInputs value={values.resources} onChange={(key, v) => onChange("resources", { ...values.resources, [key]: v })} />
        </Field>
      </section>

      <section className="rounded-[18px] border border-[#E1E1E1] bg-[#F8F8F8] p-4">
        <Field label="Emergency location">
          <div className="flex items-center gap-3 rounded-[12px] border border-[#E1E1E1] bg-white px-3.5 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E9E4FF] text-[#5F4FC9]">
              <MapPin size={16} />
            </span>

            <p className="min-w-0 flex-1 font-mono text-[11px] text-[#5F5F63]">
              {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Select location"}
            </p>

            <Button type="button" size="sm" variant="secondary" onClick={onOpenLocationPicker}>Change</Button>
          </div>
        </Field>
      </section>

      <Alert>{error}</Alert>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          variant="primary"
          size="md"
          full
          disabled={loading}
          icon={loading ? LoaderCircle : ArrowRight}
          className={cn(loading && "[&>svg]:animate-spin", "sm:w-auto")}
        >
          {loading ? "Creating request…" : "Create Emergency Request"}
        </Button>
        <Button variant="ghost" size="md" onClick={onReset} className="sm:min-w-[120px]">Reset form</Button>
      </div>
    </form>
  );
}
