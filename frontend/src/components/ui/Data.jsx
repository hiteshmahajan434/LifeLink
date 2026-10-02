import { cn } from "../../utils/cn";

/** Small metric card: label + icon on top, big number, footnote */
export function StatCard({ title, value, unit, note, icon: Icon, tone = "primary" }) {
  return (
    <div className="rounded-card border border-line bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-label font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
        {Icon && (
          <span className={cn("grid h-9 w-9 place-items-center rounded-full", tone === "accent" ? "bg-accent-soft text-accent-strong" : "bg-primary-soft text-primary-strong")}>
            <Icon size={17} />
          </span>
        )}
      </div>
      <p className="mt-3 text-headline font-bold tabular-nums tracking-tight text-ink">
        {value}
        {unit && <span className="ml-1.5 text-body font-medium text-ink-muted">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-caption text-ink-muted">{note}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, className }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-workspace", className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** "Showing 4 of 18 requests      Previous 1 2 Next" */
export function Pagination({ page, pageSize, total, onPage, noun = "requests" }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const nav = "rounded-full px-3 py-1.5 text-caption font-semibold text-ink-soft hover:text-ink disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
      <p className="text-caption text-ink-muted">
        Showing <b className="text-ink">{from}–{to}</b> of <b className="text-ink">{total}</b> {noun}
      </p>
      <div className="flex items-center gap-1">
        <button className={nav} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="grid h-8 min-w-8 place-items-center rounded-full bg-card-dark px-2 text-caption font-semibold text-on-dark">{page}</span>
        <button className={nav} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
