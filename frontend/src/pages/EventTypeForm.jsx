import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

const emptyForm = {
  slug: "",
  title: "",
  duration: 30,
  buffer_before: 0,
  buffer_after: 0,
  location: "Google Meet",
  active: true,
};

const DURATION_PRESETS = [15, 30, 45, 60];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EventTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const editing = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [slugModifiedByUser, setSlugModifiedByUser] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.eventTypes
      .list()
      .then((res) => {
        const item = res.data.find((e) => e.id === Number(id));
        if (!item) throw new Error("Event type not found.");
        setForm(item);
        setSlugModifiedByUser(true);
      })
      .catch((err) => {
        const msg = getErrorMessage(err, "Could not load event type.");
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  }, [editing, id]);

  const handleTitleChange = (val) => {
    setForm((prev) => {
      const updated = { ...prev, title: val };
      if (!editing && !slugModifiedByUser) {
        updated.slug = slugify(val);
      }
      return updated;
    });
  };

  const handleSlugChange = (val) => {
    setSlugModifiedByUser(true);
    setForm((prev) => ({ ...prev, slug: slugify(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await api.eventTypes.update(id, form);
        showToast("Event type updated successfully.", "success");
      } else {
        await api.eventTypes.create(form);
        showToast("Event type created successfully.", "success");
      }
      navigate("/event-types");
    } catch (err) {
      const msg = getErrorMessage(err, "Could not save event type.");
      setError(msg);
      showToast(msg, "error");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-md w-1/3"></div>
        <div className="h-80 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-base-content">
            {editing ? "Edit Event Type" : "Create Event Type"}
          </h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Define length, URL slug, and buffer rules.
          </p>
        </div>
        <Link
          to="/event-types"
          className="btn btn-ghost btn-sm gap-1.5 text-xs font-normal rounded-md border border-base-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </Link>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-base-200 text-rose-600 dark:text-rose-400 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-base-100 border border-base-200 rounded-lg p-5 space-y-4 shadow-xs"
      >
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-base-content">
            Meeting Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 30 Min Sync"
            className="input input-bordered input-sm w-full text-xs rounded-md"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-base-content">
            URL Slug <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-md border border-base-300 bg-neutral-50/50 dark:bg-neutral-900/50 px-2.5 py-1.5 text-xs">
            <span className="text-base-content/40 font-mono text-[11px] select-none">/book/username/</span>
            <input
              type="text"
              placeholder="30min-sync"
              className="bg-transparent border-0 focus:outline-none flex-1 font-mono text-xs text-base-content pl-1"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Duration & Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-base-content">
              Duration (minutes) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, duration: m })}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    form.duration === m
                      ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-neutral-800 text-base-content/60 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            min="5"
            step="5"
            className="input input-bordered input-sm w-full text-xs rounded-md"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            required
          />
        </div>

        {/* Buffers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-base-content">
              Buffer Before (mins)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              className="input input-bordered input-sm w-full text-xs rounded-md"
              value={form.buffer_before}
              onChange={(e) => setForm({ ...form, buffer_before: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-base-content">
              Buffer After (mins)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              className="input input-bordered input-sm w-full text-xs rounded-md"
              value={form.buffer_after}
              onChange={(e) => setForm({ ...form, buffer_after: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-base-content">
            Location / Video Provider
          </label>
          <input
            type="text"
            placeholder="Google Meet"
            className="input input-bordered input-sm w-full text-xs rounded-md"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        {/* Active Toggle */}
        <div className="pt-2.5 border-t border-base-200 flex items-center justify-between">
          <div>
            <span className="font-medium text-xs text-base-content block">Active for Booking</span>
            <span className="text-[11px] text-base-content/50">
              When disabled, guests cannot schedule appointments.
            </span>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-200">
          <button
            type="button"
            className="btn btn-ghost btn-sm text-xs font-normal rounded-md"
            onClick={() => navigate("/event-types")}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm text-xs font-medium rounded-md shadow-xs"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Saving...
              </>
            ) : editing ? (
              "Save Changes"
            ) : (
              "Create Event Type"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}