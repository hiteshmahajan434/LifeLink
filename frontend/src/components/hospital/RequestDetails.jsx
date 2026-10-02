import { ExternalLink } from "lucide-react";
import { Card, CardHeader, StatusBadge } from "../ui";
import RequirementsSummary from "../emergency/RequirementsSummary";
import { getRequirements } from "../../utils/status";
import { formatDateTime } from "../../utils/format";
import { toLatLng } from "../../utils/geo";

/** Side panel: everything a hospital needs to decide on one request. */
export default function RequestDetails({ request, status }) {
  if (!request) {
    return (
      <Card>
        <CardHeader title="Emergency Details" />
        <p className="mt-3 text-body text-ink-muted">Select “View Details” on a request to see the full emergency here.</p>
      </Card>
    );
  }

  const emergency = request.emergencyId || {};
  const point = toLatLng(emergency);

  return (
    <Card className="p-5">
      <CardHeader title="Emergency Details" subtitle={`Received ${formatDateTime(request.createdAt)}`} action={<StatusBadge status={status} />} />
      <p className="mb-4 mt-3 font-mono text-body font-semibold text-ink">{emergency.id}</p>
      <RequirementsSummary requirements={getRequirements(emergency)} />

      {point && (
        <div className="mt-5 rounded-field bg-card-muted p-3.5">
          <p className="text-label font-semibold uppercase tracking-wider text-ink-muted">Location</p>
          <p className="mt-1 font-mono text-caption text-ink-soft">{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</p>
          <a
            href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=16/${point.latitude}/${point.longitude}`}
            target="_blank" rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-caption font-semibold text-ink underline"
          >
            Open in map <ExternalLink size={12} />
          </a>
        </div>
      )}
      {request.expiresAt && <p className="mt-4 text-caption text-ink-muted">Expires {formatDateTime(request.expiresAt)}</p>}
    </Card>
  );
}
