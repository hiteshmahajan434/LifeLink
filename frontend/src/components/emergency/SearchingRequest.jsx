import {
  Check,
  Hospital,
  LoaderCircle,
  Phone,
  MapPin,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  StatusBadge,
} from "../ui";

import { cn } from "../../utils/cn";

import {
  distanceKm,
  toLatLng,
} from "../../utils/geo";

import {
  completeHandover,
} from "../../api/emergency.api";


const HANDOVER_RADIUS_KM = 0.2;


const STEPS = [
  {
    label: "Requirements confirmed",
    done: () => true,
  },

  {
    label: "Hospitals notified",
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
  location,
  onHandoverComplete,
  onReset,
}) {

  // Request state is updated directly
  // by Socket.IO / parent state.
  const live = request;


  const assigned =
    live?.status ===
      "HOSPITAL_ASSIGNED" ||
    live?.status === "COMPLETED";


  /*
   * assignedHospital can be:
   *
   * 1. A populated hospital object
   * 2. A MongoDB ObjectId
   * 3. A public hospital ID such as HOSP-101
   */

const hospital = (() => {
  if (!live?.assignedHospital) {
    return null;
  }

  const assignedId =
    typeof live.assignedHospital === "object"
      ? live.assignedHospital._id ||
        live.assignedHospital.id
      : live.assignedHospital;

  const matchedHospital =
    hospitals.find(
      (hospital) =>
        String(hospital._id) ===
          String(assignedId) ||
        String(hospital.id) ===
          String(assignedId)
    );

  // Prefer the complete hospital from the hospitals list.
  if (matchedHospital) {
    return matchedHospital;
  }

  // Fallback to populated assignedHospital.
  if (
    typeof live.assignedHospital === "object"
  ) {
    return live.assignedHospital;
  }

  return null;
})();


  // ------------------------------------------------
  // Distance to assigned hospital
  // ------------------------------------------------

let distance = null;
let canHandover = false;

if (
  live?.status === "HOSPITAL_ASSIGNED" &&
  location &&
  hospital?.location
) {
  const hospitalPoint =
    toLatLng(hospital);

  if (hospitalPoint) {
    distance = distanceKm(
      location.latitude,
      location.longitude,
      hospitalPoint.latitude,
      hospitalPoint.longitude
    );

    canHandover =
      distance <= HANDOVER_RADIUS_KM;
  }
}


  // ------------------------------------------------
  // Handover
  // ------------------------------------------------

  const handleHandover = async (
    type
  ) => {

    if (!live?._id) {

      console.error(
        "❌ Emergency ID is missing."
      );

      return;
    }


    try {

      const response =
        await completeHandover(
          live._id,
          type
        );


      console.log(
        "✅ Handover completed:",
        response
      );


      onHandoverComplete?.(
        response.emergency
      );

    } catch (error) {

      console.error(
        "❌ Handover failed:",
        error
      );
    }
  };


  return (
    <div className="space-y-5">

      {/* Emergency ID + current status */}

      <div className="flex items-center justify-between">

        <Badge tone="accent">
          Emergency{" "}
          {live?.id || "Unknown"}
        </Badge>


        <StatusBadge
          status={live?.status}
        />

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

          {live?.status ===
          "COMPLETED"

            ? "Handover completed"

            : assigned

              ? "Hospital assigned"

              : "Finding a hospital"}

        </h3>


        <p className="mx-auto mt-1 max-w-[280px] text-caption text-ink-muted">

          {live?.status ===
          "COMPLETED"

            ? "The patient has been successfully handed over to the assigned hospital."

            : assigned

              ? "A hospital has accepted your request. Proceed to the destination."

              : "We're contacting nearby hospitals that can handle your requirements."}

        </p>

      </div>


      {/* Progress steps */}

      <ol className="space-y-2.5">

        {STEPS.map(
          (step) => {

            const done =
              step.done(
                live?.status
              );


            return (
              <li
                key={
                  step.label
                }
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

          }
        )}

      </ol>


      {/* Assigned hospital */}

      {assigned && (

        <Card
          tone="primary"
          className="p-4"
        >

          <div className="flex items-start justify-between gap-3">

            <div>

              <p className="text-body font-semibold text-ink">

                {hospital?.name ||
                  "Assigned hospital"}

              </p>


              {hospital?.address && (

                <p className="mt-0.5 text-caption text-ink-soft">

                  {hospital.address}

                </p>

              )}

            </div>


            {hospital?.phone && (

              <a
                href={`tel:${hospital.phone}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-field bg-card-dark px-3.5 py-2 text-caption font-semibold text-on-dark"
              >

                <Phone size={14} />

                {hospital.phone}

              </a>

            )}

          </div>


          {/* --------------------------------------
              Handover section
          --------------------------------------- */}

          {live?.status ===
            "HOSPITAL_ASSIGNED" && (

            <div className="mt-4 border-t border-line pt-4">

              {/* Distance */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <MapPin
                    size={15}
                    className={
                      canHandover
                        ? "text-primary"
                        : "text-ink-muted"
                    }
                  />


                  <span className="text-caption font-medium text-ink">

                    {distance !==
                    null

                      ? `${Math.round(
                          distance *
                            1000
                        )} m away`

                      : "Calculating distance..."}

                  </span>

                </div>


                {canHandover && (

                  <span className="text-caption font-semibold text-primary">

                    Hospital nearby

                  </span>

                )}

              </div>


              {/* Complete Handover */}

              <Button
                full
                className="mt-3"
                disabled={
                  !canHandover
                }
                onClick={() =>
                  handleHandover(
                    "ARRIVED"
                  )
                }
              >

                {canHandover

                  ? "Complete Handover"

                  : "Reach hospital to handover"}

              </Button>


              {/* Handover Anyway */}

              <button
                type="button"
                className="mt-3 w-full text-caption font-semibold text-ink-muted transition hover:text-ink"
                onClick={() =>
                  handleHandover(
                    "ANYWAY"
                  )
                }
              >

                Handover Anyway

              </button>

            </div>

          )}


          {/* --------------------------------------
              Completed handover
          --------------------------------------- */}

          {live?.status ===
            "COMPLETED" && (

            <div className="mt-4 rounded-field bg-workspace p-3 text-center">

              <p className="text-body font-semibold text-ink">

                Handover completed

              </p>


              <p className="mt-1 text-caption text-ink-muted">

                Patient successfully handed
                over to{" "}

                {hospital?.name ||
                  "the assigned hospital"}.

              </p>

            </div>

          )}

        </Card>

      )}


      {/* Start a new emergency */}

      <Button
        full
        onClick={onReset}
      >
        New request
      </Button>

    </div>
  );
}