import { CircleAlert, CircleCheck, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import Button from "./Button";
import { cn } from "../../utils/cn";

/* Loading / error / empty states — used by every page */

export const LoadingState = ({ label = "Loading…", className }) => (
  <div className={cn("flex min-h-[320px] items-center justify-center gap-3 text-body text-ink-soft", className)}>
    <LoaderCircle size={18} className="animate-spin" />
    {label}
  </div>
);

export const ErrorState = ({ message, onRetry, className }) => (
  <div className={cn("flex min-h-[240px] flex-col items-center justify-center gap-3 text-center", className)}>
    <span className="grid h-11 w-11 place-items-center rounded-full bg-critical-soft text-critical">
      <CircleAlert size={20} />
    </span>
    <p className="max-w-sm text-body text-ink-soft">{message || "Something went wrong."}</p>
    {onRetry && <Button size="sm" icon={RefreshCw} onClick={onRetry}>Try again</Button>}
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, text, className }) => (
  <div className={cn("flex min-h-[240px] flex-col items-center justify-center gap-1.5 px-6 text-center", className)}>
    <span className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-workspace text-ink-muted">
      <Icon size={22} />
    </span>
    <p className="text-subtitle font-semibold text-ink">{title}</p>
    {text && <p className="max-w-xs text-body text-ink-muted">{text}</p>}
  </div>
);

/** Inline banner. tone: error | success */
export const Alert = ({ tone = "error", children, className }) => {
  if (!children) return null;
  const isError = tone === "error";
  const Icon = isError ? CircleAlert : CircleCheck;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-field px-3.5 py-3 text-body font-medium",
        isError ? "bg-critical-soft text-critical" : "bg-primary-soft text-primary-strong",
        className
      )}
    >
      <Icon size={16} className="mt-px shrink-0" />
      <span>{children}</span>
    </div>
  );
};
