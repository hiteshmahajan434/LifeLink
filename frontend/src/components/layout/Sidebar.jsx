import { NavLink } from "react-router-dom";
import { LogOut, Zap } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Dark navigation rail. Fully driven by props, so the same component
 * serves the ambulance and hospital portals (see config/navigation.js).
 *
 *   md+  → vertical rail (icons only on md, icons + labels from lg)
 *   <md  → compact bar docked at the bottom of the screen
 */
export default function Sidebar({ items, basePath, badges = {}, logoutLabel = "Logout", onLogout }) {
  return (
    <aside className="flex shrink-0 items-center justify-around px-3 py-2 md:w-20 md:flex-col md:items-stretch md:justify-start md:px-4 md:py-6 lg:w-64 xl:w-72">
      {/* Brand */}
      <div className="hidden items-center gap-3 px-2 md:flex md:justify-center lg:mb-10 lg:justify-start">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-on-primary">
          <Zap size={20} strokeWidth={2.4} />
        </span>
        <span className="hidden text-title font-semibold tracking-tight text-on-dark lg:block">LifeLink</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1 md:mt-8 md:flex-col md:items-stretch md:gap-1.5 lg:mt-0">
        {items.map(({ label, path, icon: Icon, badge }) => {
          const count = badge ? badges[badge] : 0;
          return (
            <NavLink
              key={label}
              to={path ? `${basePath}/${path}` : basePath}
              end={!path}
              title={label}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center gap-3 rounded-full px-4 py-3 text-subtitle font-medium transition lg:justify-between",
                  isActive ? "bg-white text-ink" : "text-sidebar-text hover:bg-sidebar-hover hover:text-on-dark"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="hidden lg:inline">{label}</span>
                  </span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "hidden h-6 min-w-6 place-items-center rounded-full px-1.5 text-caption font-bold lg:grid",
                        isActive ? "bg-primary text-on-primary" : "bg-sidebar-hover text-sidebar-text"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="md:mt-auto md:border-t md:border-sidebar-hover md:pt-4">
        <button
          onClick={onLogout}
          title={logoutLabel}
          className="flex w-full items-center justify-center gap-3 rounded-full px-4 py-3 text-subtitle font-medium text-sidebar-text transition hover:bg-sidebar-hover hover:text-on-dark lg:justify-start"
        >
          <LogOut size={20} strokeWidth={1.8} />
          <span className="hidden lg:inline">{logoutLabel}</span>
        </button>
      </div>
    </aside>
  );
}
