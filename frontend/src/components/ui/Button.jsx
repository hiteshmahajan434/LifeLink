import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line bg-card text-ink hover:border-ink",
  dark: "bg-card-dark text-on-dark hover:bg-sidebar-hover",
  accent: "bg-accent text-ink hover:bg-accent-hover",
  danger: "border border-critical/30 bg-card text-critical hover:bg-critical-soft",
  ghost: "text-ink-soft hover:bg-card-muted hover:text-ink",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3.5 text-caption",
  md: "h-11 gap-2 px-5 text-body",
};

/**
 * variant: primary | secondary | dark | accent | danger | ghost
 * size:    sm | md
 * icon:    a lucide icon component      loading: shows a spinner
 * pill:    fully-rounded ends
 */
export default function Button({
  variant = "secondary", size = "md", icon: Icon, loading = false, pill = false,
  full = false, className, children, type = "button", disabled, ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        pill ? "rounded-full" : "rounded-field",
        VARIANTS[variant], SIZES[size], full && "w-full", className
      )}
      {...rest}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : Icon && <Icon size={size === "sm" ? 14 : 17} />}
      {children}
    </button>
  );
}
