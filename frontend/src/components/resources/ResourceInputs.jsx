import { Stepper, ToggleRow } from "../ui/Controls";
import { COUNTABLE_RESOURCES, CRITICAL_RESOURCES } from "../../config/resources";

/**
 * Editable resource requirements: four counters + oxygen / blood toggles.
 * `value` uses the backend keys (icuBeds, …, oxygenSupply, bloodBank).
 * `onChange(key, newValue)` fires per field — used by the create form AND the edit step.
 */
export default function ResourceInputs({ value = {}, onChange }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {COUNTABLE_RESOURCES.map(({ key, label }) => (
          <Stepper key={key} label={label.replace(" Beds", " beds")} value={value[key] ?? 0} onChange={(v) => onChange(key, v)} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CRITICAL_RESOURCES.map(({ key, label }) => (
          <ToggleRow key={key} label={label.replace(" Supply", " supply").replace(" Bank", " bank")} checked={!!value[key]} onChange={(v) => onChange(key, v)} />
        ))}
      </div>
    </div>
  );
}
