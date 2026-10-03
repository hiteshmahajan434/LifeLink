import { LoaderCircle, MapPin, Mic, Siren } from "lucide-react";
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Emergency description">
        <Textarea
          rows={3}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="e.g. Two-vehicle collision on the expressway, multiple injuries, driver trapped…"
        />
      </Field>

      <Field
        label="Voice transcript"
        aside={voice.isListening && (
          <span className="flex items-center gap-1.5 text-label font-semibold text-accent-strong">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-strong" /> Live transcribing
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
            className="pr-14"
          />
          <button
            type="button"
            onClick={voice.toggle}
            aria-label={voice.isListening ? "Stop voice input" : "Start voice input"}
            className={cn(
              "absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full transition",
              voice.isListening ? "animate-pulse bg-critical text-white" : "bg-accent text-ink hover:bg-accent-hover"
            )}
          >
            <Mic size={16} />
          </button>
        </div>
      </Field>

      <Field label="Emergency type">
        <Select value={values.emergencyType} onChange={(e) => set("emergencyType")(e.target.value)}>
          <option value="">Select emergency type</option>
          {EMERGENCY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>

      <Field label="Number of patients">
        <ChipGroup
          value={values.patientCount}
          onChange={set("patientCount")}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
        />
      </Field>

      <Field label="Required resources">
        <ResourceInputs value={values.resources} onChange={(key, v) => onChange("resources", { ...values.resources, [key]: v })} />
      </Field>

      <div className="flex items-center gap-3 rounded-field border border-line bg-card-muted px-3.5 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-ink">
          <MapPin size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-ink">
            Emergency Location
          </p>

          <p className="font-mono text-caption text-ink-muted">
            {location
              ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
              : "Select location"}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onOpenLocationPicker}
        >
          Change
        </Button>
      </div>

      <Alert>{error}</Alert>

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="md" full disabled={loading} icon={loading ? LoaderCircle : Siren}
          className={cn(loading && "[&>svg]:animate-spin")}>
          {loading ? "Creating request…" : "Create Emergency Request"}
        </Button>
        <Button onClick={onReset}>Reset</Button>
      </div>
    </form>
  );
}
