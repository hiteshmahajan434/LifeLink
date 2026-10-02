import { cn } from "../../utils/cn";

const FIELD_BASE =
  "w-full rounded-field border border-line bg-card-muted px-3.5 text-body text-ink " +
  "placeholder:text-ink-muted outline-none transition focus:border-ink focus:bg-card " +
  "focus:ring-4 focus:ring-ink/10 disabled:cursor-not-allowed disabled:text-ink-muted read-only:text-ink-muted";

export const Input = ({ className, ...props }) => <input className={cn(FIELD_BASE, "h-11", className)} {...props} />;
export const Select = ({ className, ...props }) => <select className={cn(FIELD_BASE, "h-11 cursor-pointer", className)} {...props} />;
export const Textarea = ({ className, ...props }) => (
  <textarea className={cn(FIELD_BASE, "resize-none py-3 leading-5", className)} {...props} />
);

/** Label + control (+ optional hint / right-side slot). */
export function Field({ label, hint, aside, children, className }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-label font-semibold uppercase tracking-wider text-ink-muted">{label}</label>
        {aside}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-caption text-ink-muted">{hint}</p>}
    </div>
  );
}
