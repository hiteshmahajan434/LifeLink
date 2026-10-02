import { cn } from "../../utils/cn";

const TONES = {
  neutral: "bg-workspace text-ink-soft",
  primary: "bg-primary-soft text-primary-strong",
  accent: "bg-accent-soft text-accent-strong",
  critical: "bg-critical-soft text-critical",
  dark: "bg-card-dark text-on-dark",
};

/** tone: neutral | primary | accent | critical | dark */
export default function Badge({ tone = "neutral", dot = false, className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label font-semibold", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
