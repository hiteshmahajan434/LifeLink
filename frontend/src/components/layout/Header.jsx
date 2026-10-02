import { Link } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";
import { getInitials } from "../../utils/format";

/** Top row of the workspace: signed-in user (left), notifications + date (right). */
export default function Header({ user, profilePath, notificationCount = 0 }) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <header className="flex items-center justify-between gap-4 px-6 pt-6 lg:px-8">
      <Link
        to={profilePath}
        className="flex min-w-0 items-center gap-3 rounded-full border border-line bg-card py-1.5 pl-1.5 pr-4 shadow-card"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card-dark text-caption font-bold text-primary">
          {getInitials(user?.name)}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="flex items-center gap-1.5 text-body font-semibold text-ink">
            <span className="truncate">{user?.name || "—"}</span>
            <ChevronDown size={14} className="shrink-0 text-ink-muted" />
          </span>
          <span className="block truncate text-label text-ink-muted">{user?.email}</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink">
          <Bell size={18} strokeWidth={1.8} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-label font-bold text-on-primary">
              {notificationCount}
            </span>
          )}
        </button>
        <span className="hidden rounded-full bg-card px-4 py-2 text-caption font-semibold text-ink-soft shadow-card sm:block">{today}</span>
      </div>
    </header>
  );
}
