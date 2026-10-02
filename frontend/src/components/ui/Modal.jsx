import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

/** Centered dialog. Closes on backdrop click and Escape. */
export default function Modal({ open = true, title, subtitle, onClose, size = "md", footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[90vh] w-full flex-col rounded-panel bg-card shadow-modal",
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-title font-semibold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-caption text-ink-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-soft hover:bg-workspace">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
