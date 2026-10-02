import { useState } from "react";
import { Pencil } from "lucide-react";
import { getHospitalResources, updateHospitalResource } from "../../api/hospital.api";
import useFetch from "../../hooks/useFetch";
import PageHero from "../../components/layout/PageHero";
import ResourceCard from "../../components/resources/ResourceCard";
import CriticalResourceRow from "../../components/resources/CriticalResourceRow";
import { Alert, Button, Card, CardHeader, ErrorState, Field, Input, LoadingState, Modal } from "../../components/ui";
import { COUNTABLE_RESOURCES, CRITICAL_RESOURCES } from "../../config/resources";
import { getErrorMessage } from "../../utils/format";

/** Manage bed / ventilator counts and the oxygen + blood-bank switches. */
const HospitalInventory = () => {
  const { data: resources, loading, error, reload } = useFetch(getHospitalResources);
  const [editing, setEditing] = useState(null);   // { key, label } of the resource being edited
  const [form, setForm] = useState({ total: 0, occupied: 0 });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const openEdit = ({ key, label }) => {
    setForm({ total: resources[key].total, occupied: resources[key].occupied });
    setActionError("");
    setEditing({ key, label });
  };

  // PUT /hospital/resources/:type — the backend accepts { total, occupied } (reserved is system-managed)
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      await updateHospitalResource(editing.key, { total: Number(form.total), occupied: Number(form.occupied) });
      await reload({ silent: true });
      setEditing(null);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to update resource."));
    } finally {
      setSaving(false);
    }
  };

  // Oxygen / blood bank: PUT { value: boolean }
  const toggle = async (key, current) => {
    try {
      setActionError("");
      await updateHospitalResource(key, { value: !current });
      await reload({ silent: true });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to update resource."));
    }
  };

  return (
    <>
      <PageHero
        eyebrow={<span className="text-label font-semibold uppercase tracking-wider text-ink-muted">Hospital resources</span>}
        title="Inventory"
        subtitle="Manage your hospital's available emergency resources."
      />

      <div className="space-y-6 px-6 pb-8 lg:px-8">
        <Alert>{!editing && actionError}</Alert>

        {loading && !resources ? (
          <LoadingState label="Loading inventory…" />
        ) : error && !resources ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {COUNTABLE_RESOURCES.map(({ key, label, icon }) => (
                <ResourceCard
                  key={key}
                  variant="inventory"
                  title={label}
                  icon={icon}
                  resource={resources[key]}
                  action={<Button size="sm" variant="ghost" aria-label={`Edit ${label}`} icon={Pencil} onClick={() => openEdit({ key, label })} />}
                />
              ))}
            </div>

            <Card className="p-6">
              <CardHeader title="Critical Resources" subtitle="Availability of essential emergency resources" />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {CRITICAL_RESOURCES.map(({ key, label, description, icon }) => (
                  <CriticalResourceRow
                    key={key}
                    icon={icon}
                    title={label}
                    description={description}
                    available={resources[key]}
                    onToggle={() => toggle(key, resources[key])}
                  />
                ))}
              </div>
            </Card>
          </>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing ? `Edit ${editing.label}` : ""}
        subtitle="Reserved beds are managed automatically by accepted emergencies."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={save}>Save changes</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Alert>{actionError}</Alert>
          <Field label="Total"><Input type="number" min="0" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))} /></Field>
          <Field label="Occupied"><Input type="number" min="0" value={form.occupied} onChange={(e) => setForm((f) => ({ ...f, occupied: e.target.value }))} /></Field>
          {editing && <p className="text-caption text-ink-muted">Reserved: <b className="text-ink">{resources[editing.key].reserved}</b> (read-only)</p>}
        </form>
      </Modal>
    </>
  );
};

export default HospitalInventory;
