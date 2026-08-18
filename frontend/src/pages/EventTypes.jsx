import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Plus,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  Video,
  AlertCircle,
} from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { getUser } from "../services/auth";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

export default function EventTypes() {
  const user = getUser();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadEventTypes = () => {
    setLoading(true);
    api.eventTypes
      .list()
      .then((res) => setItems(res.data || []))
      .catch((err) => {
        const msg = getErrorMessage(err);
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadEventTypes, []);

  const toggleActive = async (item) => {
    try {
      await api.eventTypes.update(item.id, { active: !item.active });
      showToast(`"${item.title}" is now ${!item.active ? "active" : "inactive"}.`, "info");
      loadEventTypes();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update event type status."), "error");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.eventTypes.remove(itemToDelete.id);
      showToast(`Deleted "${itemToDelete.title}".`, "success");
      setItemToDelete(null);
      loadEventTypes();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not delete event type."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/book/${user?.username}/${slug}`;
    navigator.clipboard.writeText(url);
    showToast("Booking link copied to clipboard.", "success");
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-md w-1/4"></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-base-content">Event Types</h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Configure meeting formats, durations, and booking links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/event-types/new"
            className="btn btn-primary btn-sm gap-1.5 text-xs font-medium rounded-md shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event Type</span>
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-base-200 text-rose-600 dark:text-rose-400 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-base-100 border border-base-200 rounded-lg p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-base-content/40 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-base-content">No event types configured</h3>
            <p className="text-[11px] text-base-content/50 mt-0.5 max-w-sm mx-auto">
              Create your first event type (such as 30 Min Meeting) to start sharing public booking links.
            </p>
          </div>
          <Link to="/event-types/new" className="btn btn-primary btn-sm text-xs rounded-md">
            Create Event Type
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-base-100 border rounded-lg p-4 flex flex-col justify-between gap-3.5 transition-colors ${
                item.active
                  ? "border-base-200"
                  : "border-base-200/50 opacity-60 bg-neutral-50/50 dark:bg-neutral-900/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs text-base-content truncate">{item.title}</h3>
                    <p className="text-[10px] font-mono text-base-content/40 truncate mt-0.5">
                      /book/{user?.username}/{item.slug}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer shrink-0 ${
                      item.active
                        ? "bg-neutral-100 dark:bg-neutral-800 text-base-content/80 border border-base-200"
                        : "bg-neutral-100 dark:bg-neutral-800 text-base-content/40 border border-base-200"
                    }`}
                    title="Click to toggle active status"
                  >
                    {item.active ? "Active" : "Inactive"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-base-content/70">
                  <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-base-content/70 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    {item.duration} min
                  </span>

                  <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-base-content/70 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    <Video className="w-2.5 h-2.5" />
                    {item.location || "Google Meet"}
                  </span>

                  {(item.buffer_before > 0 || item.buffer_after > 0) && (
                    <span className="text-[10px] text-base-content/40 px-1">
                      +{item.buffer_before}m / +{item.buffer_after}m buffer
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2.5 border-t border-base-200 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost border border-base-200 text-xs font-normal rounded px-2"
                    onClick={() => copyLink(item.slug)}
                    title="Copy public booking link"
                  >
                    <Copy className="w-3 h-3 text-base-content/50" />
                    Copy Link
                  </button>
                  <a
                    href={`/book/${user?.username}/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-ghost border border-base-200 text-xs font-normal rounded px-2"
                    title="Preview booking page"
                  >
                    <ExternalLink className="w-3 h-3 text-base-content/50" />
                  </a>
                </div>

                <div className="flex items-center gap-0.5">
                  <Link
                    to={`/event-types/${item.id}/edit`}
                    className="p-1 rounded text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    className="p-1 rounded text-base-content/50 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    onClick={() => setItemToDelete(item)}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Delete Event Type"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? Existing scheduled bookings will remain intact.`}
        confirmLabel="Delete"
        confirmVariant="btn-error"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}