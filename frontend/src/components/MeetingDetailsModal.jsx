import { Calendar, Clock, User, Mail, Video, ExternalLink, Copy, AlertTriangle, X } from "lucide-react";
import { formatDateTime, formatTime, formatDate } from "../utils/dates";
import { useToast } from "../context/ToastContext";

const STATUS_BADGE = {
  CONFIRMED: "badge-success text-success-content",
  PENDING: "badge-warning text-warning-content",
  CANCELLED: "badge-error text-error-content",
  FAILED: "badge-ghost",
};

export default function MeetingDetailsModal({
  booking,
  isOpen,
  onClose,
  onCancelBooking,
  isCancelling = false,
}) {
  const { showToast } = useToast();
  if (!isOpen || !booking) return null;

  const copyMeetLink = () => {
    if (booking.meet_link) {
      navigator.clipboard.writeText(booking.meet_link);
      showToast("Google Meet link copied!", "success");
    }
  };

  const copyToken = () => {
    if (booking.cancellation_token) {
      navigator.clipboard.writeText(booking.cancellation_token);
      showToast("Cancellation token copied!", "success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-base-100 rounded-2xl border border-base-200 shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-base-200 flex items-start justify-between bg-base-200/30">
          <div>
            <div className="flex items-center gap-2">
              <span className={`badge badge-sm font-medium ${STATUS_BADGE[booking.status] || "badge-ghost"}`}>
                {booking.status}
              </span>
              <span className="text-[11px] font-mono text-base-content/50">ID: #{booking.id}</span>
            </div>
            <h3 className="font-bold text-lg mt-1 text-base-content tracking-tight">
              {booking.event_type || "Scheduled Meeting"}
            </h3>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-200 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-base-200/50 rounded-xl border border-base-200">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50 block">Date</span>
                <p className="font-semibold text-xs text-base-content mt-0.5">{formatDate(booking.start_time)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50 block">Time</span>
                <p className="font-semibold text-xs text-base-content mt-0.5">
                  {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Invitee Details */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50 block">Participant</span>
            <div className="flex items-center gap-3 p-3 bg-base-200/30 rounded-xl border border-base-200">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                {booking.invitee_name?.slice(0, 1) || "G"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-base-content truncate">{booking.invitee_name}</p>
                <p className="text-[11px] text-base-content/60 truncate">{booking.invitee_email}</p>
              </div>
            </div>
          </div>

          {/* Location / Google Meet */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50 block">Meeting Location</span>
            <div className="p-3 bg-base-200/30 rounded-xl border border-base-200">
              {booking.meet_link ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-primary font-medium truncate">
                    <Video className="w-4 h-4 shrink-0" />
                    <span className="truncate">{booking.meet_link}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost gap-1"
                      onClick={copyMeetLink}
                      title="Copy meeting link"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <a
                      href={booking.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs btn-primary gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Join
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-base-content/60 text-xs flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {booking.google_event_id ? "Synced with Google Calendar" : "Standard booking (No video link attached)"}
                </p>
              )}
            </div>
          </div>

          {/* Cancellation Token (if available) */}
          {booking.cancellation_token && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50 block">Cancellation Token</span>
              <div className="flex items-center justify-between p-2 bg-base-200/60 rounded-lg border border-base-200 text-[11px] font-mono text-base-content/70">
                <span className="truncate mr-2">{booking.cancellation_token}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={copyToken}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-base-200/40 border-t border-base-200 flex items-center justify-between">
          <div>
            {booking.status !== "CANCELLED" && onCancelBooking && (
              <button
                type="button"
                className="btn btn-outline btn-error btn-xs gap-1.5"
                onClick={() => onCancelBooking(booking)}
                disabled={isCancelling}
              >
                <AlertTriangle className="w-3 h-3" />
                Cancel Meeting
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
