import Badge from "./Badge";
import { formatLabel } from "../../utils/format";

/**
 * ONE place that decides how every backend status looks.
 *   lime      = success / confirmed      lavender = in progress / AI
 *   neutral   = closed / expired         red      = critical only
 */
const STATUS_META = {
  // Emergency request statuses
  PARSED: { tone: "accent", text: "Parsed" },
  CONFIRMED: { tone: "primary", text: "Confirmed" },
  SEARCHING_HOSPITAL: { tone: "accent", text: "Searching" },
  HOSPITALS_PINGED: { tone: "accent", text: "Hospitals Pinged" },
  HOSPITAL_ASSIGNED: { tone: "primary", text: "Hospital Assigned" },
  COMPLETED: { tone: "neutral", text: "Completed" },
  CANCELLED: { tone: "neutral", text: "Cancelled" },
  // Hospital request statuses
  PENDING: { tone: "accent", text: "Pending" },
  ACCEPTED: { tone: "primary", text: "Accepted" },
  REJECTED: { tone: "neutral", text: "Rejected" },
  EXPIRED: { tone: "neutral", text: "Expired" },
};

export default function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || { tone: "neutral", text: formatLabel(status) || "Unknown" };
  return <Badge tone={meta.tone} className={className}>{meta.text}</Badge>;
}
