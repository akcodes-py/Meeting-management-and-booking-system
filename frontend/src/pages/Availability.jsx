import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Plus, AlertCircle, Layers } from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

const WEEKDAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

export default function Availability() {
  const { showToast } = useToast();

  const [eventTypes, setEventTypes] = useState([]);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    event_type: "",
    weekday: 0,
    start_time: "09:00",
    end_time: "17:00",
  });
  const [addingRule, setAddingRule] = useState(false);

  // Delete modal state
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.eventTypes.list(), api.availability.list()])
      .then(([types, av]) => {
        setEventTypes(types.data || []);
        setRules(av.data || []);
        if (types.data && types.data[0]) {
          setForm((f) => ({ ...f, event_type: types.data[0].id }));
        }
      })
      .catch((err) => {
        const msg = getErrorMessage(err);
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const addRule = async (e) => {
    e.preventDefault();
    if (!form.event_type) {
      showToast("Please select an event type.", "error");
      return;
    }
    if (form.end_time <= form.start_time) {
      showToast("End time must be later than start time.", "error");
      return;
    }

    setAddingRule(true);
    setError("");
    try {
      await api.availability.create(form);
      showToast("Availability window added.", "success");
      loadData();
    } catch (err) {
      const msg = getErrorMessage(err, "Could not add availability rule.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    setDeleting(true);
    try {
      await api.availability.remove(ruleToDelete.id);
      showToast("Availability window removed.", "success");
      setRuleToDelete(null);
      loadData();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not remove availability window."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const weekdayLabel = (value) => WEEKDAYS.find((w) => w.value === value)?.label ?? value;
  const eventTypeLabel = (id) => eventTypes.find((t) => t.id === id)?.title ?? id;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-md w-1/4"></div>
        <div className="h-36 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
        <div className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-base-content">Weekly Availability</h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Define recurring working hours for invitee scheduling.
          </p>
        </div>
        <Link
          to="/event-types"
          className="btn btn-ghost btn-sm gap-1.5 text-xs font-normal self-start sm:self-auto rounded-md border border-base-200"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Event Types</span>
        </Link>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-base-200 text-rose-600 dark:text-rose-400 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {eventTypes.length === 0 ? (
        <div className="bg-base-100 border border-base-200 rounded-lg p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-base-content/40 flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-base-content">Create an event type first</h3>
            <p className="text-[11px] text-base-content/50 mt-0.5 max-w-sm mx-auto">
              Availability rules are assigned to event types.
            </p>
          </div>
          <Link to="/event-types/new" className="btn btn-primary btn-sm text-xs rounded-md">
            Create Event Type
          </Link>
        </div>
      ) : (
        <>
          {/* Add Availability Form */}
          <form
            onSubmit={addRule}
            className="bg-base-100 border border-base-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-base-content/60" />
              <h2 className="font-semibold text-xs text-base-content">
                Add Availability Window
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-base-content/70">Event Type</label>
                <select
                  className="select select-bordered select-sm w-full text-xs rounded-md"
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: Number(e.target.value) })}
                >
                  {eventTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-base-content/70">Day of Week</label>
                <select
                  className="select select-bordered select-sm w-full text-xs rounded-md"
                  value={form.weekday}
                  onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-base-content/70">Start Time</label>
                <input
                  type="time"
                  className="input input-bordered input-sm w-full text-xs rounded-md"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-base-content/70">End Time</label>
                <input
                  type="time"
                  className="input input-bordered input-sm w-full text-xs rounded-md"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="btn btn-primary btn-sm text-xs font-medium rounded-md shadow-xs"
                disabled={addingRule}
              >
                {addingRule ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Adding...
                  </>
                ) : (
                  "+ Add Window"
                )}
              </button>
            </div>
          </form>

          {/* Active Rules List */}
          <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-base-200 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
              <h2 className="font-semibold text-xs text-base-content">
                Active Availability Windows
              </h2>
              <span className="text-[11px] text-base-content/50">
                {rules.length} {rules.length === 1 ? "window" : "windows"} configured
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="p-8 text-center text-xs text-base-content/50">
                No availability windows set. Guests will see zero open time slots.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-[11px] font-medium text-base-content/50 border-b border-base-200">
                      <th className="py-2.5 px-4">Event Type</th>
                      <th>Day</th>
                      <th>Working Hours</th>
                      <th className="text-right px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {rules.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-xs text-base-content">
                          {eventTypeLabel(r.event_type)}
                        </td>
                        <td className="text-xs text-base-content/70">
                          {weekdayLabel(r.weekday)}
                        </td>
                        <td className="text-xs font-mono text-base-content">
                          {r.start_time} – {r.end_time}
                        </td>
                        <td className="text-right px-4">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-xs text-rose-600 hover:bg-rose-500/10 rounded font-normal"
                            onClick={() => setRuleToDelete(r)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(ruleToDelete)}
        title="Remove Availability Window"
        message={`Are you sure you want to remove ${weekdayLabel(
          ruleToDelete?.weekday
        )} (${ruleToDelete?.start_time} - ${ruleToDelete?.end_time}) for "${eventTypeLabel(
          ruleToDelete?.event_type
        )}"?`}
        confirmLabel="Remove"
        confirmVariant="btn-error"
        isLoading={deleting}
        onConfirm={handleDeleteRule}
        onCancel={() => setRuleToDelete(null)}
      />
    </div>
  );
}