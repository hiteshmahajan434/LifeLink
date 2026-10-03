import {
  Check,
  Hospital,
  LoaderCircle,
  Phone,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  StatusBadge,
} from "../ui";
import { cn } from "../../utils/cn";

const STEPS = [
  {
    label: "Requirements confirmed",
    done: () => true,
  },
  {
    label: "Hospitals notified",
    //Later we will add web socket event for this
    // done: (status) =>
    //   [
    //     "HOSPITALS_PINGED",
    //     "HOSPITAL_ASSIGNED",
    //     "COMPLETED",
    //   ].includes(status),
    done: () => true,
  },
  {
    label: "Hospital assigned",
    done: (status) =>
      [
        "HOSPITAL_ASSIGNED",
        "COMPLETED",
      ].includes(status),
  },
];

export default function SearchingRequest({
  request,
  hospitals = [],
  onReset,
}) {
  // Request state is now updated directly by Socket.IO.
  const live = request;

  const assigned =
    live?.status === "HOSPITAL_ASSIGNED" ||
    live?.status === "COMPLETED";

  /*
   * assignedHospital can be:
   *
   * 1. A populated hospital object
   * 2. A MongoDB ObjectId
   * 3. A public hospital ID such as HOSP-101
   */
  const hospital =
    live?.assignedHospital &&
    typeof live.assignedHospital === "object"
      ? live.assignedHospital
      : live?.assignedHospital
        ? hospitals.find(
            (hospital) =>
              String(hospital._id) ===
                String(live.assignedHospital) ||
              String(hospital.id) ===
                String(live.assignedHospital)
          )
        : null;

  return (
    <div className="space-y-5">
      {/* Emergency ID + current status */}

      <div className="flex items-center justify-between">
        <Badge tone="accent">
          Emergency {live?.id || "Unknown"}
        </Badge>

        <StatusBadge status={live?.status} />
      </div>

      {/* Main status */}

      <div className="py-2 text-center">
        <span
          className={cn(
            "mx-auto grid h-16 w-16 place-items-center rounded-full",
            assigned
              ? "bg-primary text-on-primary"
              : "bg-accent-soft text-accent-strong"
          )}
        >
          {assigned ? (
            <Hospital size={28} />
          ) : (
            <LoaderCircle
              size={28}
              className="animate-spin"
            />
          )}
        </span>

        <h3 className="mt-4 text-subtitle font-semibold text-ink">
          {assigned
            ? "Hospital assigned"
            : "Finding a hospital"}
        </h3>

        <p className="mx-auto mt-1 max-w-[280px] text-caption text-ink-muted">
          {assigned
            ? "A hospital has accepted your request. Proceed to the destination."
            : "We're contacting nearby hospitals that can handle your requirements."}
        </p>
      </div>

      {/* Progress steps */}

      <ol className="space-y-2.5">
        {STEPS.map((step) => {
          const done = step.done(live?.status);

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 text-body font-medium",
                done
                  ? "text-ink"
                  : "text-ink-muted"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full",
                  done
                    ? "bg-primary text-on-primary"
                    : "bg-workspace"
                )}
              >
                {done && (
                  <Check
                    size={13}
                    strokeWidth={3}
                  />
                )}
              </span>

              {step.label}
            </li>
          );
        })}
      </ol>

      {/* Assigned hospital */}

      {assigned && (
        <Card tone="primary" className="p-4">
          <p className="text-body font-semibold text-ink">
            {hospital?.name || "Assigned hospital"}
          </p>

          {hospital?.address && (
            <p className="mt-0.5 text-caption text-ink-soft">
              {hospital.address}
            </p>
          )}

          {hospital?.phone && (
            <a
              href={`tel:${hospital.phone}`}
              className="mt-3 inline-flex items-center gap-2 rounded-field bg-card-dark px-3.5 py-2 text-caption font-semibold text-on-dark"
            >
              <Phone size={14} />

              {hospital.phone}
            </a>
          )}
        </Card>
      )}

      {/* Start a new emergency */}

      <Button full onClick={onReset}>
        New request
      </Button>
    </div>
  );
}