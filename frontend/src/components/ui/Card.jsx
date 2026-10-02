import { cn } from "../../utils/cn";

const TONES = {
  default: "border border-line bg-card shadow-card",
  muted: "border border-line bg-card-muted",
  dark: "bg-card-dark text-on-dark",
  primary: "border border-primary-strong/20 bg-primary-soft",
};

/** tone: default | muted | dark | primary — padding via className (default p-5) */
export default function Card({ tone = "default", className, children, ...rest }) {
  return (
    <div className={cn("rounded-card", TONES[tone], className ?? "p-5")} {...rest}>
      {children}
    </div>
  );
}

/** Title row used at the top of most cards. `action` sits on the right. */
export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-subtitle font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-caption text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
