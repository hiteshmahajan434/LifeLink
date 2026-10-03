import { useState } from "react";
import { ClipboardList, Eye, HeartPulse, Hospital, RefreshCw, Zap, CircleCheck, CircleAlert } from "lucide-react";

import { getEmergencyRequests } from "../../api/ambulance.api";

import useFetch from "../../hooks/useFetch";

import PageHero from "../../components/layout/PageHero";
import RequirementsSummary from "../../components/emergency/RequirementsSummary";
import {
  Button, Card, CardHeader, ChipGroup, EmptyState, ErrorState, LoadingState, Modal, Pagination, StatCard, StatusBadge,
} from "../../components/ui";

import { CRITICAL_EMERGENCY_TYPES } from "../../config/resources";
import { formatDate, formatDateTime, formatLabel } from "../../utils/format";
import { getRequirements } from "../../utils/status";

const ACTIVE = ["CONFIRMED", "SEARCHING_HOSPITAL", "HOSPITALS_PINGED", "HOSPITAL_ASSIGNED"];
const PAGE_SIZE = 6;

const getType = (r) => getRequirements(r)?.emergencyType || r.inputs?.quickSelect?.emergencyType || "";

/** Dispatch history: stat cards + filterable, paginated table + details modal. */
const AmbulanceRequests = () => {
  const { data, loading, error, reload } = useFetch(getEmergencyRequests);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const requests = Array.isArray(data) ? data : [];
  const active = requests.filter((r) => ACTIVE.includes(r.status));
  const completed = requests.filter((r) => r.status === "COMPLETED");
  const cancelled = requests.filter((r) => r.status === "CANCELLED");
  const filtered = filter === "active" ? active : filter === "completed" ? completed : requests;
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHero
        title="Requests Overview"
        subtitle="View and manage previous emergency dispatches & hospital triage"
        actions={<Button icon={RefreshCw} onClick={() => reload()} loading={loading}>Refresh</Button>}
      />

      <div className="space-y-6 px-6 pb-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total dispatches" value={requests.length} note="All time" icon={Zap} />
          <StatCard title="Active" value={active.length} note="Currently in progress" icon={HeartPulse} tone="accent" />
          <StatCard title="Cancelled" value={cancelled.length} note="Cancelled ones" icon={CircleAlert} />
          <StatCard title="Completed" value={completed.length} note="Closed cases" icon={CircleCheck} tone="accent" />
        </div>

        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
            <CardHeader title="Dispatch Log" subtitle="Real-time emergency unit routing & hospital statuses" />
            <ChipGroup
              value={filter}
              onChange={(v) => { setFilter(v); setPage(1); }}
              options={[
                { value: "all", label: `All (${requests.length})` },
                { value: "active", label: `Active (${active.length})` },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>

          {loading && !data ? (
            <LoadingState label="Loading requests…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No requests found" text="Emergency requests you create will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="bg-card-muted text-label font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="px-6 py-3.5">Request ID</th>
                    <th className="px-6 py-3.5">Emergency</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-t border-line text-body">
                      <td className="px-6 py-4 font-mono font-semibold text-ink">{r.id || r._id}</td>
                      <td className="px-6 py-4 text-ink">
                        <span className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full ${CRITICAL_EMERGENCY_TYPES.includes(getType(r)) ? "bg-critical" : "bg-accent"}`} />
                          {formatLabel(getType(r)) || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-soft">{formatDate(r.createdAt)}</td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-4 text-right"><Button size="sm" icon={Eye} onClick={() => setSelected(r)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />}
        </Card>
      </div>

      <Modal
        open={!!selected}
        size="lg"
        title={selected ? `Emergency ${selected.id}` : ""}
        subtitle={selected ? `Created ${formatDateTime(selected.createdAt)}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-4">
            <StatusBadge status={selected.status} />
            <RequirementsSummary requirements={getRequirements(selected)} />
          </div>
        )}
      </Modal>
    </>
  );
};

export default AmbulanceRequests;
