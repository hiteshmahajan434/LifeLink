import { LayoutGrid, TriangleAlert, UserRound, Package } from "lucide-react";

/**
 * Role → portal configuration.
 * One Sidebar / AppLayout renders any role from this table.
 *
 * `path` is relative to the portal's base path ("" = the portal index).
 * `badge` names a counter provided by useNavBadges().
 */
export const PORTALS = {
  AMBULANCE: {
    label: "Ambulance Portal",
    basePath: "/ambulance",
    logoutLabel: "Logout",
    nav: [
      { label: "Home", path: "", icon: LayoutGrid },
      { label: "Requests", path: "requests", icon: TriangleAlert, badge: "requests" },
      { label: "Profile", path: "profile", icon: UserRound },
    ],
  },
  HOSPITAL: {
    label: "Hospital Portal",
    basePath: "/hospital",
    logoutLabel: "Logout",
    nav: [
      { label: "Dashboard", path: "", icon: LayoutGrid },
      { label: "Requests", path: "requests", icon: TriangleAlert, badge: "requests" },
      { label: "Inventory", path: "inventory", icon: Package },
      { label: "Profile", path: "profile", icon: UserRound },
    ],
  },
};
