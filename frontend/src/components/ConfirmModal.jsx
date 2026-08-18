import { AlertCircle, AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "btn-error",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isDanger = confirmVariant.includes("error");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-base-100 rounded-2xl border border-base-200 shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isDanger ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-base-content tracking-tight">{title}</h3>
            <p className="text-xs text-base-content/70 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm text-xs"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${confirmVariant} btn-sm text-xs font-medium shadow-xs`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
