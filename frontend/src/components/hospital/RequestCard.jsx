import { MapPin, Timer, Users } from "lucide-react";
import { Badge, Button, Card, StatusBadge } from "../ui";
import { CRITICAL_EMERGENCY_TYPES } from "../../config/resources";
import { getRequirements } from "../../utils/status";
import { distanceKm, etaMinutes, toLatLng } from "../../utils/geo";
import { formatDateTime, formatLabel } from "../../utils/format";
import { cn } from "../../utils/cn";

const RESOURCE_CHIPS = [
  ["icuBeds", "ICU Bed"], ["traumaBeds", "Trauma Bed"], ["generalBeds", "General Bed"], ["ventilators", "Ventilator"],
];

const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * One incoming emergency request.
 *   request       HospitalEmergencyRequest (emergencyId populated)
 *   status        effective status (PENDING / ACCEPTED / REJECTED / EXPIRED …)
 *   hospitalPoint { latitude, longitude } of this hospital, for the distance line
 */
export default function RequestCard({ request, status, now, hospitalPoint, selected, processing, onView, onAccept, onReject }) {
  const emergency = request.emergencyId || {};
  const requirements = getRequirements(emergency) || {};
  const resources = requirements.requiredResources || {};
  const pending = status === "PENDING";
  const critical = CRITICAL_EMERGENCY_TYPES.includes(requirements.emergencyType);

  const from = toLatLng(emergency);
  const km = from && hospitalPoint ? distanceKm(from.latitude, from.longitude, hospitalPoint.latitude, hospitalPoint.longitude) : null;
  const msLeft = request.expiresAt ? new Date(request.expiresAt).getTime() - now : null;

  return (
    <Card className={cn("border-l-4 border-l-ink p-5 transition", selected && "ring-2 ring-ink", !pending && "opacity-90")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {critical && pending && <Badge tone="critical">Critical</Badge>}
          <StatusBadge status={status} />
          <span className="font-mono text-caption font-semibold text-ink-muted">{emergency.id}</span>
        </div>
        {pending && msLeft != null && (
          <span className="flex items-center gap-1.5 text-caption font-semibold text-ink">
            <Timer size={14} /> <span className="tabular-nums">{formatCountdown(msLeft)}</span>
            <span className="font-normal text-ink-muted">Response required</span>
          </span>
        )}
      </div>

      <h3 className="mt-3 text-title font-semibold tracking-tight text-ink">{formatLabel(requirements.emergencyType) || "Emergency"}</h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted">
        <span className="flex items-center gap-1.5"><Users size={13} /> {requirements.patients?.length ?? 0} patient(s)</span>
        {km != null && <span className="flex items-center gap-1.5"><MapPin size={13} /> {km.toFixed(1)} km away · ETA ~{etaMinutes(km)} min</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {RESOURCE_CHIPS.filter(([key]) => resources[key] > 0).map(([key, label]) => (
          <span key={key} className="rounded-full bg-card-muted px-3 py-1 text-caption font-semibold text-ink-soft">{label} × {resources[key]}</span>
        ))}
        {resources.oxygenSupply && <span className="rounded-full bg-card-muted px-3 py-1 text-caption font-semibold text-ink-soft">Oxygen</span>}
        {resources.bloodBank && <span className="rounded-full bg-critical-soft px-3 py-1 text-caption font-semibold text-critical">Blood required</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-caption text-ink-muted">Requested {formatDateTime(request.createdAt)}</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={onView}>View Details</Button>
          {pending && (
            <>
              <Button size="sm" variant="danger" disabled={processing} onClick={onReject}>Reject</Button>
              <Button size="sm" variant="primary" loading={processing} onClick={onAccept}>Accept</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
