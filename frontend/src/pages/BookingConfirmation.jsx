import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Video,
  ExternalLink,
  Copy,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "../utils/dates";
import { useToast } from "../context/ToastContext";
import ThemeToggle from "../components/ThemeToggle";

export default function BookingConfirmation() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { showToast } = useToast();
  const booking = state?.booking;
  const hostName = state?.hostName;

  const copyToken = () => {
    if (booking?.cancellation_token) {
      navigator.clipboard.writeText(booking.cancellation_token);
      showToast("Cancellation token copied!", "success");
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-4 transition-colors duration-150">
        <div className="bg-base-100 border border-base-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
          <h1 className="text-base font-bold text-base-content">No Booking Details Found</h1>
          <p className="text-xs text-base-content/60">
            It looks like this confirmation page was accessed directly.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm text-xs rounded-lg w-full"
            onClick={() => navigate(`/book/${username}/${slug}`)}
          >
            Go to Booking Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col transition-colors duration-150">
      {/* Top Header */}
      <header className="border-b border-base-200 bg-base-100/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-sm text-base-content">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span>MeetingManager</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Confirmation Content */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12">
        <div className="bg-base-100 border border-base-200 rounded-2xl p-7 space-y-6 shadow-lg animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-base-content">You're Scheduled!</h1>
            <p className="text-xs text-base-content/70">
              A calendar invitation and confirmation details have been emailed to{" "}
              <span className="font-semibold text-base-content">{booking.invitee_email}</span>.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-base-200/50 border border-base-200 rounded-xl p-4.5 space-y-3.5 text-xs">
            <div className="flex justify-between items-start gap-2">
              <span className="text-base-content/50 font-medium">Meeting:</span>
              <span className="font-bold text-right text-base-content">{booking.event_type}</span>
            </div>

            <div className="flex justify-between items-start gap-2">
              <span className="text-base-content/50 font-medium">Date:</span>
              <span className="font-semibold text-right text-base-content">
                {formatDate(booking.start_time)}
              </span>
            </div>

            <div className="flex justify-between items-start gap-2">
              <span className="text-base-content/50 font-medium">Time:</span>
              <span className="font-semibold text-right text-base-content">
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
              </span>
            </div>

            <div className="flex justify-between items-start gap-2">
              <span className="text-base-content/50 font-medium">Invitee:</span>
              <span className="font-semibold text-right text-base-content">{booking.invitee_name}</span>
            </div>

            {booking.meet_link && (
              <div className="pt-3 border-t border-base-200 flex justify-between items-center gap-2">
                <span className="text-base-content/50 font-medium">Google Meet:</span>
                <a
                  href={booking.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-xs btn-primary gap-1 rounded-lg"
                >
                  <Video className="w-3 h-3" />
                  Join Call
                </a>
              </div>
            )}
          </div>

          {/* Cancellation Info */}
          {booking.cancellation_token && (
            <div className="bg-base-200/40 border border-base-200 rounded-xl p-3.5 text-[11px] space-y-1.5">
              <span className="text-base-content/60 font-medium block">Cancellation Token</span>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-base-content/80 break-all text-[10px] bg-base-200 px-2 py-1 rounded">
                  {booking.cancellation_token}
                </code>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-[10px] gap-1 shrink-0"
                  onClick={copyToken}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              className="btn btn-outline btn-sm w-full text-xs rounded-lg"
              onClick={() => navigate(`/book/${username}/${slug}`)}
            >
              Book Another Appointment
            </button>
            <Link to="/" className="btn btn-ghost btn-sm w-full text-xs text-base-content/60 rounded-lg">
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}