import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { getHospitalDashboard } from "../../api/hospital.api";
import useFetch from "../../hooks/useFetch";
import PageHero from "../../components/layout/PageHero";
import ResourceCard from "../../components/resources/ResourceCard";
import CriticalResourceRow from "../../components/resources/CriticalResourceRow";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, LoadingState, StatusBadge } from "../../components/ui";
import { COUNTABLE_RESOURCES, CRITICAL_RESOURCES } from "../../config/resources";
import { formatDateTime, formatLabel } from "../../utils/format";
import { getEffectiveStatus, getRequirements } from "../../utils/status";

/** Hospital overview: capacity cards, recent requests, readiness of critical resources. */
const HospitalDashboard = () => {
  const { data, loading, error, reload } = useFetch(getHospitalDashboard, { interval: 20000 });

  if (loading && !data) return <LoadingState label="Loading dashboard…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { hospital, resources, statistics, recentRequests = [] } = data;

  return (
    <>
      <PageHero
        eyebrow={<Badge tone="primary" className="font-mono">{hospital.id}</Badge>}
        title="Hospital Dashboard"
        subtitle="Monitor your hospital capacity and incoming emergency requests in real-time."
      />

      <div className="space-y-6 px-6 pb-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COUNTABLE_RESOURCES.map(({ key, label, icon }) => (
            <ResourceCard key={key} title={label} icon={icon} resource={resources[key]} />
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          {/* Recent requests */}
          <Card className="p-0">
            <div className="px-6 py-5">
              <CardHeader
                title="Incoming Requests"
                subtitle="Recent emergency dispatches received by your hospital"
                action={<Badge>{statistics.pendingRequests} pending</Badge>}
              />
            </div>

            {recentRequests.length === 0 ? (
              <EmptyState title="No requests yet" text="Incoming emergency dispatches will appear here." className="min-h-[200px]" />
            ) : (
              <ul>
                {recentRequests.map((request) => {
                  const emergency = request.emergencyId || {};
                  return (
                    <li key={request._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
                      <div>
                        <p className="text-body">
                          <span className="font-mono font-semibold text-ink">{emergency.id || "Emergency"}</span>
                          <span className="ml-2 text-ink-soft">{formatLabel(getRequirements(emergency)?.emergencyType)}</span>
                        </p>
                        <p className="mt-0.5 text-caption text-ink-muted">{formatDateTime(request.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={getEffectiveStatus(request)} />
                        <Link to="requests"><Button size="sm" icon={Eye}>View</Button></Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Readiness */}
          <Card className="space-y-3 p-6">
            <CardHeader title="Resource Status" subtitle="Critical hospital resources readiness" />
            {CRITICAL_RESOURCES.map(({ key, label, icon }) => (
              <CriticalResourceRow key={key} icon={icon} title={label} available={resources[key]} />
            ))}

            <dl className="space-y-3 border-t border-line pt-4 text-body">
              {[["Pending Requests", statistics.pendingRequests], ["Accepted Requests", statistics.acceptedRequests], ["Active Requests", statistics.activeRequests]].map(([term, value]) => (
                <div key={term} className="flex items-center justify-between">
                  <dt className="text-ink-soft">{term}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <Card tone="dark" className="flex items-center justify-between p-4">
              <div>
                <p className="text-label uppercase tracking-wider text-on-dark-muted">Automatic CAD routing</p>
                <p className="text-body font-semibold text-primary">Active &amp; Receiving</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20">
                <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
              </span>
            </Card>
          </Card>
        </div>
      </div>
    </>
  );
};

export default HospitalDashboard;
