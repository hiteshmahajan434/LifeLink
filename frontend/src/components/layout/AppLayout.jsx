import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PORTALS } from "../../config/navigation";
import useNavBadges from "../../hooks/useNavBadges";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * The shell for every portal page:
 *
 *   dark frame ─┬─ Sidebar
 *               └─ rounded light workspace ─┬─ Header
 *                                           └─ <Outlet />  (the page)
 *
 * `role` picks the navigation from config/navigation.js.
 * `basePath` lets the same layout be mounted at a test URL (e.g. /test/hospital).
 */
export default function AppLayout({ role, basePath }) {
  const { user, logout } = useAuth();
  const portal = PORTALS[role];
  const base = basePath ?? portal.basePath;
  const badges = useNavBadges(role);

  return (
    <div className="flex h-dvh flex-col-reverse overflow-hidden bg-frame md:flex-row">
      <Sidebar
        items={portal.nav}
        basePath={base}
        badges={badges}
        logoutLabel={portal.logoutLabel}
        onLogout={logout}
      />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto scrollbar-hide bg-workspace md:my-3 md:mr-3 md:rounded-panel">
        <Header user={user} profilePath={`${base}/profile`} notificationCount={badges.requests} />
        <Outlet />
      </main>
    </div>
  );
}
