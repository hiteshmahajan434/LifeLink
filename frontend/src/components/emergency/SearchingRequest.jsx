import {
  CircleAlert,
  Hospital,
  LoaderCircle,
  MapPin,
  Phone,
  Check,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  StatusBadge,
} from "../ui";

import { distanceKm, toLatLng } from "../../utils/geo";

import { completeHandover } from "../../api/emergency.api";

const HANDOVER_RADIUS_KM = 0.2;

export default function SearchingRequest({
  request,
  hospitals = [],
  location,
  route,
  onHandoverComplete,
  onReset,
  onCancel
}) {
  const live = request;

  const assigned =
    live?.status === "HOSPITAL_ASSIGNED" ||
    live?.status === "COMPLETED";

  const completed =
    live?.status === "COMPLETED";

  const noHospitalAvailable =
    live?.status === "NO_HOSPITAL_AVAILABLE";

  // =================================================
  // Resolve assigned hospital
  // =================================================

  const hospital = (() => {
    if (!live?.assignedHospital) {
      return null;
    }

    const assignedId =
      typeof live.assignedHospital === "object"
        ? live.assignedHospital._id ||
          live.assignedHospital.id
        : live.assignedHospital;

    const matchedHospital = hospitals.find(
      (hospital) =>
        String(hospital._id) === String(assignedId) ||
        String(hospital.id) === String(assignedId)
    );

    if (matchedHospital) {
      return matchedHospital;
    }

    if (
      typeof live.assignedHospital === "object"
    ) {
      return live.assignedHospital;
    }

    return null;
  })();

  const completedAt =
    live?.completedAt ||
    live?.handoverCompletedAt ||
    live?.updatedAt ||
    null;

  const formattedCompletedAt = completedAt
    ? new Date(completedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  // =================================================
  // Handover proximity
  // =================================================

  let proximityDistance = null;
  let canHandover = false;

  if (
    live?.status === "HOSPITAL_ASSIGNED" &&
    location &&
    hospital?.location
  ) {
    const hospitalPoint = toLatLng(hospital);

    if (hospitalPoint) {
      proximityDistance = distanceKm(
        location.latitude,
        location.longitude,
        hospitalPoint.latitude,
        hospitalPoint.longitude
      );

      canHandover =
        proximityDistance <= HANDOVER_RADIUS_KM;
    }
  }

  // =================================================
  // Road distance + ETA
  // =================================================

  const roadDistanceKm =
    route?.distanceMeters != null
      ? route.distanceMeters / 1000
      : null;

  const roadDurationMinutes =
    route?.durationSeconds != null
      ? Math.max(
          1,
          Math.ceil(route.durationSeconds / 60)
        )
      : null;

  // =================================================
  // Handover
  // =================================================

  const handleHandover = async (type) => {
    if (!live?._id) {
      console.error("❌ Emergency ID is missing.");
      return;
    }

    try {
      // Capture the actual completion time and resolved hospital
      // before the emergency status changes to COMPLETED.
      const handoverTime = new Date().toISOString();
      const hospitalAtHandover = hospital;

      const response = await completeHandover(
        live._id,
        type
      );

      console.log("✅ Handover completed:", response);

      const completedEmergency = {
        ...response.emergency,
        completedAt:
          response.emergency?.completedAt ||
          response.emergency?.handoverCompletedAt ||
          handoverTime,
        assignedHospital:
          response.emergency?.assignedHospital ||
          hospitalAtHandover,
      };

      onHandoverComplete?.(completedEmergency);
    } catch (error) {
      console.error("❌ Handover failed:", error);
    }
  };

  // =================================================
  // RENDER
  // =================================================

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex shrink-0 items-center justify-between">

        <Badge tone="accent">
          Emergency {live?.id || "Unknown"}
        </Badge>

        <StatusBadge
          status={live?.status}
        />

      </div>


      {/* =================================================
          SEARCHING STATE
      ================================================= */}

      {!assigned &&
        !noHospitalAvailable && (
          <div className="mt-3 flex min-h-0 flex-1 flex-col">

            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">

              <div className="px-5 pb-5 pt-6 text-center">

                <div
                  className="
                    mx-auto grid h-16 w-16
                    place-items-center
                    rounded-full
                    bg-accent-soft
                    text-accent-strong
                  "
                >
                  <LoaderCircle
                    size={27}
                    className="animate-spin"
                  />
                </div>

                <h3
                  className="
                    mt-4
                    text-subtitle
                    font-semibold
                    text-ink
                  "
                >
                  Finding a hospital
                </h3>

                <p
                  className="
                    mx-auto mt-1
                    max-w-[280px]
                    text-caption
                    leading-relaxed
                    text-ink-muted
                  "
                >
                  We're finding an available hospital
                  that can handle this emergency.
                </p>

              </div>


              {/* Searching status */}

              <div
                className="
                  mx-5
                  rounded-xl
                  border border-line
                  bg-workspace
                  px-4 py-3
                "
              >

                <div className="flex items-center gap-3">

                  <span className="relative flex h-2.5 w-2.5 shrink-0">

                    <span
                      className="
                        absolute
                        inline-flex
                        h-full w-full
                        animate-ping
                        rounded-full
                        bg-primary
                        opacity-60
                      "
                    />

                    <span
                      className="
                        relative
                        flex h-2.5 w-2.5
                        rounded-full
                        bg-primary
                      "
                    />

                  </span>

                  <div>

                    <p
                      className="
                        text-caption
                        font-semibold
                        text-ink
                      "
                    >
                      Searching nearby
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[11px]
                        text-ink-muted
                      "
                    >
                      Please stay at the emergency
                      location.
                    </p>

                  </div>

                </div>

              </div>


              <div className="flex-1" />


              {/* Cancel */}

              <div className="p-5">

                <button
                  type="button"
                  onClick={onCancel}
                  className="
                    w-full
                    rounded-xl
                    border border-line
                    bg-card
                    px-4 py-3
                    text-caption
                    font-semibold
                    text-ink
                    transition
                    hover:bg-workspace
                  "
                >
                  Cancel request
                </button>

              </div>

            </Card>

          </div>
        )}


      {/* =================================================
          NO HOSPITAL AVAILABLE
      ================================================= */}

      {noHospitalAvailable && (
        <Card
          className="
            mt-3
            flex
            min-h-0
            flex-1
            flex-col
            justify-between
            border
            border-line
            bg-card
            p-6
            text-center
          "
        >

          <div>

            <div
              className="
                mx-auto grid h-14 w-14
                place-items-center
                rounded-full
                bg-red-50
                text-red-600
              "
            >
              <CircleAlert size={25} />
            </div>

            <h3
              className="
                mt-4
                text-subtitle
                font-semibold
                text-ink
              "
            >
              No hospital available
            </h3>

            <p
              className="
                mx-auto mt-1
                max-w-[290px]
                text-caption
                leading-relaxed
                text-ink-muted
              "
            >
              We couldn't find an available hospital
              that can handle this emergency right now.
            </p>

          </div>

          <Button
            full
            className="mt-8"
            onClick={onReset}
          >
            Try Again
          </Button>

        </Card>
      )}


      {/* =================================================
          ASSIGNED HOSPITAL
      ================================================= */}

      {assigned && (
        <Card
          className="
            mt-6
            flex
            min-h-0
            flex-1
            flex-col
            overflow-hidden
            bg-white
          "
        >

          {/* =================================================
              ASSIGNED HEADER
          ================================================= */}

          {!completed && (
            <div className="shrink-0 px-5 pb-4 pt-8">

              <div className="flex items-start gap-3">

                <div
                  className="
                    grid h-11 w-11
                    shrink-0
                    place-items-center
                    rounded-xl
                    bg-primary
                    text-on-primary
                  "
                >
                  <Hospital size={21} />
                </div>

                <div className="min-w-0">

                  <p
                    className="
                      text-caption
                      font-medium
                      text-ink-muted
                    "
                  >
                    Hospital assigned
                  </p>

                  <h3
                    className="
                      mt-0.5
                      text-subtitle
                      font-semibold
                      text-ink
                    "
                  >
                    Your destination is ready
                  </h3>

                </div>

              </div>


              <p
                className="
                  mt-5
                  text-caption
                  leading-relaxed
                  text-ink-muted
                "
              >
                A hospital has accepted this emergency.
                Proceed to the assigned destination.
              </p>

            </div>
          )}


          {/* =================================================
              HOSPITAL DETAILS
          ================================================= */}

          {!completed && hospital && (
            <div
              className="
                mx-5
                mb-6
                rounded-xl
                border
                border-primary/20
                bg-[#F7FBD9]
                p-4
              "
            >

              {/* Hospital identity */}

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >

                <div className="min-w-0">

                  <p
                    className="
                      text-body
                      font-semibold
                      text-ink
                      truncate
                    "
                  >
                    {hospital?.name ||
                      "Assigned hospital"}
                  </p>

                  {hospital?.address && (
                    <p
                      className="
                        mt-1
                        text-caption
                        text-ink-soft
                        line-clamp-1
                      "
                    >
                      {hospital.address}
                    </p>
                  )}

                </div>


                {/* Call */}

                {hospital?.phone && (
                  <a
                    href={`tel:${hospital.phone}`}
                    className="
                      inline-flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-lg
                      bg-card-dark
                      px-3 py-2
                      text-[11px]
                      font-semibold
                      text-on-dark
                      transition
                      hover:opacity-90
                    "
                  >
                    <Phone size={13} />
                    Call
                  </a>
                )}

              </div>


              {/* Distance + ETA */}

              <div
                className="
                  mt-5
                  grid
                  grid-cols-2
                  gap-2
                "
              >

                <div
                  className="
                    rounded-lg
                    bg-workspace
                    px-3 py-2.5
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                    "
                  >

                    <MapPin
                      size={14}
                      className="text-primary"
                    />

                    <span
                      className="
                        text-[11px]
                        text-ink-muted
                      "
                    >
                      Distance
                    </span>

                  </div>

                  <p
                    className="
                      mt-2
                      text-body
                      font-semibold
                      text-ink
                    "
                  >
                    {roadDistanceKm !== null
                      ? `${roadDistanceKm.toFixed(1)} km`
                      : "Calculating..."}
                  </p>

                </div>


                <div
                  className="
                    rounded-lg
                    bg-workspace
                    px-3 py-2.5
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                    "
                  >

                    <LoaderCircle
                      size={14}
                      className="text-primary"
                    />

                    <span
                      className="
                        text-[11px]
                        text-ink-muted
                      "
                    >
                      ETA
                    </span>

                  </div>

                  <p
                    className="
                      mt-1
                      text-body
                      font-semibold
                      text-ink
                    "
                  >
                    {roadDurationMinutes !== null
                      ? `${roadDurationMinutes} min`
                      : "Calculating..."}
                  </p>

                </div>

              </div>


              {/* Handover */}

              <div
                className="
                  mt-6
                  border-t
                  border-line
                  pt-3
                "
              >

                {canHandover && (
                  <div
                    className="
                      mb-6
                      flex
                      items-center
                      gap-2
                      rounded-lg
                      bg-primary/10
                      px-3 py-2
                    "
                  >

                    <Check
                      size={14}
                      className="text-primary"
                    />

                    <span
                      className="
                        text-[11px]
                        font-semibold
                        text-ink
                      "
                    >
                      You have reached the hospital
                    </span>

                  </div>
                )}


                <Button
                  full
                  disabled={!canHandover}
                  onClick={() =>
                    handleHandover("ARRIVED")
                  }
                >
                  {canHandover
                    ? "Complete Handover"
                    : "Reach hospital to handover"}
                </Button>


                <button
                  type="button"
                  className="
                    mt-3
                    w-full
                    py-1
                    text-[11px]
                    font-semibold
                    text-ink-muted
                    transition
                    hover:text-ink
                  "
                  onClick={() =>
                    handleHandover("ANYWAY")
                  }
                >
                  Handover Anyway
                </button>

              </div>

            </div>
          )}


          {/* =================================================
              COMPLETED STATE
          ================================================= */}

          {completed && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
                {/* Success */}

                <div
                  className="
                    grid h-16 w-16
                    place-items-center
                    rounded-full
                    bg-primary
                    text-on-primary
                  "
                >
                  <Check
                    size={30}
                    strokeWidth={3}
                  />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-ink">
                  Handover completed
                </h3>

                <p className="mt-2 max-w-[300px] text-center text-caption leading-relaxed text-ink-muted">
                  Patient successfully handed over to{" "}
                  <span className="font-semibold text-ink">
                    {hospital?.name || "the assigned hospital"}
                  </span>.
                </p>

                {/* Useful completion details */}

                <div
                  className="
                    mt-7 w-full max-w-[360px]
                    rounded-xl border border-line
                    bg-workspace px-4 py-4
                    text-left
                  "
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        grid h-9 w-9 shrink-0
                        place-items-center
                        rounded-lg
                        bg-card
                        text-primary
                      "
                    >
                      <Hospital size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                        Destination
                      </p>

                      <p className="mt-1 truncate text-caption font-semibold text-ink">
                        {hospital?.name || "Assigned hospital"}
                      </p>

                      {hospital?.address && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-soft">
                          {hospital.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                        Emergency ID
                      </p>

                      <p className="mt-1 truncate text-caption font-semibold text-ink">
                        {live?.id || "Unknown"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                        Handover time
                      </p>

                      <p className="mt-1 truncate text-caption font-semibold text-ink">
                        {formattedCompletedAt || "Completed"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* New emergency */}

              <div className="shrink-0 p-5 pt-3">
                <Button
                  full
                  onClick={onReset}
                >
                  + New emergency request
                </Button>
              </div>
            </div>
          )}

          {/* Keep the assigned state vertically balanced */}

          {!completed && (
            <div className="min-h-0 flex-1" />
          )}

        </Card>
      )}

    </div>
  );
}