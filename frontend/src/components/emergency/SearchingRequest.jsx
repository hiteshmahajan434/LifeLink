import { useEffect } from "react";
import { Check, Hospital, LoaderCircle, Phone } from "lucide-react";
import { getEmergencyRequests } from "../../api/ambulance.api";
import useFetch from "../../hooks/useFetch";
import { Badge, Button, Card, StatusBadge } from "../ui";
import { cn } from "../../utils/cn";

const STEPS = [
  { label: "Requirements confirmed", done: () => true },
  { label: "Hospitals notified", done: (s) => ["HOSPITALS_PINGED", "HOSPITAL_ASSIGNED", "COMPLETED"].includes(s) },
  { label: "Hospital assigned", done: (s) => ["HOSPITAL_ASSIGNED", "COMPLETED"].includes(s) },
];

/**
 * Step 3 — hospital matching. Polls the ambulance's request list every 5 s
 * (GET /ambulance/emergency) until a hospital is assigned.
 * The assigned hospital is looked up in the nearby-hospitals list already loaded for the map.
 */
export default function SearchingRequest({ request, hospitals, onAssigned, onReset }) {
  const { data } = useFetch(getEmergencyRequests, { interval: 5000 });

  const live = (Array.isArray(data) ? data : []).find((r) => r._id === request._id) || request;
  const assigned = live.status === "HOSPITAL_ASSIGNED" || live.status === "COMPLETED";
  const assignedId = live.assignedHospital?._id ?? live.assignedHospital;
  const hospital = assignedId ? hospitals.find((h) => String(h._id) === String(assignedId)) : null;

  // Tell the map which hospital to draw the route to
  useEffect(() => {
    onAssigned?.(assigned ? hospital : null);
  }, [assigned, hospital, onAssigned]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge tone="accent">Emergency #{request.id}</Badge>
        <StatusBadge status={live.status} />
      </div>

      <div className="py-2 text-center">
        <span className={cn("mx-auto grid h-16 w-16 place-items-center rounded-full", assigned ? "bg-primary text-on-primary" : "bg-accent-soft text-accent-strong")}>
          {assigned ? <Hospital size={28} /> : <LoaderCircle size={28} className="animate-spin" />}
        </span>
        <h3 className="mt-4 text-subtitle font-semibold text-ink">{assigned ? "Hospital assigned" : "Finding a hospital"}</h3>
        <p className="mx-auto mt-1 max-w-[280px] text-caption text-ink-muted">
          {assigned
            ? "A hospital has accepted your request. Proceed to the destination."
            : "We're contacting nearby hospitals that can handle your requirements."}
        </p>
      </div>

      <ol className="space-y-2.5">
        {STEPS.map((step) => {
          const done = step.done(live.status);
          return (
            <li key={step.label} className={cn("flex items-center gap-3 text-body font-medium", done ? "text-ink" : "text-ink-muted")}>
              <span className={cn("grid h-6 w-6 place-items-center rounded-full", done ? "bg-primary text-on-primary" : "bg-workspace")}>
                {done && <Check size={13} strokeWidth={3} />}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>

      {assigned && (
        <Card tone="primary" className="p-4">
          <p className="text-body font-semibold text-ink">{hospital?.name || "Assigned hospital"}</p>
          {hospital?.address && <p className="mt-0.5 text-caption text-ink-soft">{hospital.address}</p>}
          {hospital?.phone && (
            <a href={`tel:${hospital.phone}`} className="mt-3 inline-flex items-center gap-2 rounded-field bg-card-dark px-3.5 py-2 text-caption font-semibold text-on-dark">
              <Phone size={14} /> {hospital.phone}
            </a>
          )}
        </Card>
      )}

      <Button full onClick={onReset}>New request</Button>
    </div>
  );
}
