import { Minus, Plus } from "lucide-react";
import { cn } from "../../utils/cn";

/** On/off switch */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-line-strong"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

/** A labelled row with a Toggle — e.g. "Oxygen supply" */
export function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-field border border-line px-3 py-2.5">
      <span className="whitespace-nowrap text-caption font-medium text-ink">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/** Small − 0 + counter used for resource quantities */
export function Stepper({ label, value, onChange, min = 0, max = 99 }) {
  const step = "grid h-6 w-6 place-items-center rounded-md bg-card-muted text-ink-soft hover:bg-primary hover:text-on-primary disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-1 rounded-field border border-line px-3 py-2.5">
      <span className="whitespace-nowrap text-caption text-ink-soft">{label}</span>
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={step}>
          <Minus size={12} />
        </button>
        <span className="w-5 text-center text-body font-semibold tabular-nums text-ink">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={step}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

/**
 * Pill selector. options: [{ value, label }]
 * variant "chips" = separate pills, "segmented" = one joined track (Ambulance | Hospital)
 */
export function ChipGroup({ options, value, onChange, variant = "chips", className }) {
  if (variant === "segmented") {
    return (
      <div role="tablist" className={cn("flex gap-1 rounded-full bg-workspace p-1", className)}>
        {options.map((o) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-body font-semibold transition",
              value === o.value ? "bg-card text-ink shadow-card" : "text-ink-soft hover:text-ink"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-4 py-2 text-caption font-semibold transition",
            value === o.value
              ? "border-primary bg-primary text-on-primary"
              : "border-line bg-card text-ink-soft hover:border-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
