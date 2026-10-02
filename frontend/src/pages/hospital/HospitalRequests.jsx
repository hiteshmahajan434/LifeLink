import { useState } from "react";
import { CircleCheck, Flame, Hourglass, Inbox, RefreshCw, CircleX } from "lucide-react";
import { acceptHospitalRequest, getHospitalRequests, rejectHospitalRequest } from "../../api/hospital.api";
import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import useNow from "../../hooks/useNow";
import PageHero from "../../components/layout/PageHero";
import RequestCard from "../../components/hospital/RequestCard";
import RequestDetails from "../../components/hospital/RequestDetails";
import { Alert, Button, ChipGroup, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { CRITICAL_EMERGENCY_TYPES } from "../../config/resources";
import { getEffectiveStatus, getRequirements } from "../../utils/status";
import { getErrorMessage } from "../../utils/format";
import { toLatLng } from "../../utils/geo";
import { cn } from "../../utils/cn";

const Tile = ({ icon: Icon, count, label, tone }) => (
  <div className="flex items-center gap-4 rounded-card border border-line bg-card p-4 shadow-card">
    <span className={cn("grid h-11 w-11 place-items-center rounded-field", tone)}><Icon size={20} /></span>
    <div>
      <p className="text-headline font-bold leading-none tabular-nums text-ink">{String(count).padStart(2, "0")}</p>
      <p className="mt-1 text-caption font-semibold text-ink-soft">{label}</p>
    </div>
  </div>
);

/** Review incoming emergencies and accept / reject them. */
const HospitalRequests = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(getHospitalRequests, { interval: 15000 });
  const now = useNow();

  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const requests = Array.isArray(data) ? data : [];
  const withStatus = requests.map((request) => ({ request, status: getEffectiveStatus(request, now) }));
  const count = (s) => withStatus.filter((x) => x.status === s).length;
  const urgent = withStatus.filter(
    (x) => x.status === "PENDING" && CRITICAL_EMERGENCY_TYPES.includes(getRequirements(x.request.emergencyId)?.emergencyType)
  ).length;

  const visible = filter === "ALL" ? withStatus : withStatus.filter((x) => x.status === filter);
  const selected = withStatus.find((x) => x.request._id === selectedId);
  const hospitalPoint = toLatLng(user);

  // Accept / reject, then refresh the list (same calls as before)
  const respond = async (request, action) => {
    try {
      setProcessingId(request._id);
      setActionError("");
      await action(request._id);
      await reload({ silent: true });
      setSelectedId(null);
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to update the request."));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <PageHero
        title="Emergency Requests"
        subtitle="Review and respond to incoming emergency requests from ambulances"
        actions={<Button icon={RefreshCw} onClick={() => reload()}>Refresh</Button>}
      />

      <div className="space-y-6 px-6 pb-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile icon={Hourglass} count={count("PENDING")} label="Pending" tone="bg-accent-soft text-accent-strong" />
          <Tile icon={Flame} count={urgent} label="Urgent" tone="bg-critical-soft text-critical" />
          <Tile icon={CircleCheck} count={count("ACCEPTED")} label="Accepted" tone="bg-primary-soft text-primary-strong" />
          <Tile icon={CircleX} count={count("REJECTED")} label="Rejected" tone="bg-workspace text-ink-soft" />
        </div>

        <ChipGroup
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: `All (${requests.length})` },
            { value: "PENDING", label: `Pending (${count("PENDING")})` },
            { value: "ACCEPTED", label: `Accepted (${count("ACCEPTED")})` },
            { value: "REJECTED", label: `Rejected (${count("REJECTED")})` },
          ]}
        />

        <Alert>{actionError}</Alert>

        {loading && !data ? (
          <LoadingState label="Loading requests…" />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
            <div className="space-y-4">
              {visible.length === 0 ? (
                <EmptyState icon={Inbox} title="No requests here" text="New emergency requests from ambulances will show up automatically." />
              ) : (
                visible.map(({ request, status }) => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    status={status}
                    now={now}
                    hospitalPoint={hospitalPoint}
                    selected={request._id === selectedId}
                    processing={processingId === request._id}
                    onView={() => setSelectedId(request._id)}
                    onAccept={() => respond(request, acceptHospitalRequest)}
                    onReject={() => respond(request, rejectHospitalRequest)}
                  />
                ))
              )}
            </div>

            <div className="xl:sticky xl:top-4">
              <RequestDetails request={selected?.request} status={selected?.status} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HospitalRequests;
