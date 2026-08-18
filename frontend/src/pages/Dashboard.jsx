import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Layers,
  Copy,
  ExternalLink,
  Plus,
  Video,
  Share2,
  CalendarCheck,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { getUser } from "../services/auth";
import { formatDateTime, formatTime, isToday } from "../utils/dates";
import { useToast } from "../context/ToastContext";
import MeetingDetailsModal from "../components/MeetingDetailsModal";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_BADGE = {
  CONFIRMED: "bg-neutral-100 dark:bg-neutral-800 text-primary border border-neutral-200 dark:border-neutral-700",
  PENDING: "bg-neutral-100 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-neutral-700",
  CANCELLED: "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700 line-through",
  FAILED: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700",
};

export default function Dashboard() {
  const user = getUser();
  const { showToast } = useToast();

  const [upcoming, setUpcoming] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [calStatus, setCalStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.bookings.upcoming(),
      api.bookings.list(),
      api.eventTypes.list(),
      api.calendar.status().catch(() => ({ data: { connected: false } })),
    ])
      .then(([up, all, types, cal]) => {
        setUpcoming(up.data || []);
        setAllBookings(all.data || []);
        setEventTypes(types.data || []);
        setCalStatus(cal.data || { connected: false });
      })
      .catch((err) => {
        const msg = getErrorMessage(err);
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await api.bookings.cancel(bookingToCancel.id);
      showToast("Meeting cancelled successfully.", "success");
      setBookingToCancel(null);
      setSelectedBooking(null);
      loadData();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not cancel meeting."), "error");
    } finally {
      setCancelling(false);
    }
  };

  const copyBookingLink = (slug) => {
    const url = `${window.location.origin}/book/${user?.username}/${slug}`;
    navigator.clipboard.writeText(url);
    showToast("Booking link copied to clipboard.", "success");
  };

  const todaysMeetings = allBookings.filter(
    (b) => isToday(b.start_time) && b.status !== "CANCELLED"
  );

  const activeEventTypes = eventTypes.filter((et) => et.active);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-md w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
          ))}
        </div>
        <div className="h-60 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-base-content">
            Dashboard
          </h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            {todaysMeetings.length === 0
              ? "No meetings scheduled for today."
              : `You have ${todaysMeetings.length} meeting${todaysMeetings.length > 1 ? "s" : ""} scheduled today.`}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {activeEventTypes.length > 0 && (
            <div className="dropdown dropdown-end">
              <button
                tabIndex={0}
                className="btn btn-sm btn-ghost border border-base-300 text-xs font-medium rounded-md gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-base-content/60" />
                <span>Share Link</span>
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content z-30 menu p-1.5 shadow-md bg-base-100 border border-base-200 rounded-md w-64 text-xs mt-1"
              >
                <li className="menu-title text-[10px] uppercase font-semibold text-base-content/50 px-2 py-1">
                  Copy Booking Link
                </li>
                {activeEventTypes.map((et) => (
                  <li key={et.id}>
                    <button
                      type="button"
                      onClick={() => copyBookingLink(et.slug)}
                      className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <span className="font-medium truncate">{et.title}</span>
                      <span className="text-[10px] text-base-content/50">{et.duration}m</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

      {/* Simple Minimal Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Today's Meetings */}
        <div className="p-3.5 bg-base-100 rounded-lg border border-base-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-base-content/50 block">Today's Meetings</span>
            <span className="text-xl font-semibold tracking-tight text-base-content mt-0.5 block">
              {todaysMeetings.length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-base-200 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 2: Upcoming Meetings */}
        <div className="p-3.5 bg-base-100 rounded-lg border border-base-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-base-content/50 block">Upcoming Scheduled</span>
            <span className="text-xl font-semibold tracking-tight text-base-content mt-0.5 block">
              {upcoming.length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-base-200 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 3: Active Event Types */}
        <div className="p-3.5 bg-base-100 rounded-lg border border-base-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-base-content/50 block">Active Event Types</span>
            <span className="text-xl font-semibold tracking-tight text-base-content mt-0.5 block">
              {activeEventTypes.length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-base-200 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 4: Google Calendar Status */}
        <div className="p-3.5 bg-base-100 rounded-lg border border-base-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-base-content/50 block">Google Calendar</span>
            <span className="text-xs font-medium mt-1 flex items-center gap-1.5">
              {calStatus?.connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-base-content/80">Connected</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                  <span className="text-base-content/50">Not Connected</span>
                </>
              )}
            </span>
          </div>
          <Link
            to="/settings"
            className="text-[11px] text-primary hover:underline font-medium"
          >
            {calStatus?.connected ? "Manage" : "Connect"}
          </Link>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-base-200 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-xs text-base-content">
              Today's Schedule
            </h2>
          </div>
          <span className="text-[11px] text-base-content/50">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {todaysMeetings.length === 0 ? (
          <div className="p-6 text-center text-xs text-base-content/50">
            No meetings scheduled for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-[11px] font-medium text-base-content/50 border-b border-base-200">
                  <th className="py-2.5 px-4">Time</th>
                  <th>Meeting</th>
                  <th>Invitee</th>
                  <th>Status</th>
                  <th className="text-right px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {todaysMeetings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td className="py-3 px-4 font-medium text-xs whitespace-nowrap text-base-content">
                      {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    </td>
                    <td>
                      <span className="font-medium text-xs text-base-content block">{b.event_type}</span>
                      {b.meet_link && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                          <Video className="w-3 h-3" />
                          Google Meet
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-base-content block">{b.invitee_name}</span>
                      <span className="text-[10px] text-base-content/50 block truncate max-w-[180px]">
                        {b.invitee_email}
                      </span>
                    </td>
                    <td>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[b.status] || "badge-ghost"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-xs font-normal"
                        onClick={() => setSelectedBooking(b)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-base-200 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-xs text-base-content">
            Upcoming Meetings
          </h2>
          <Link to="/bookings" className="text-xs text-primary hover:underline font-medium">
            View All ({allBookings.length}) →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-6 text-center text-xs text-base-content/50">
            No upcoming meetings booked yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-[11px] font-medium text-base-content/50 border-b border-base-200">
                  <th className="py-2.5 px-4">When</th>
                  <th>Event Type</th>
                  <th>Invitee</th>
                  <th>Status</th>
                  <th className="text-right px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {upcoming.slice(0, 6).map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <span className="font-medium text-base-content block">{formatDateTime(b.start_time)}</span>
                    </td>
                    <td className="text-xs text-base-content">{b.event_type}</td>
                    <td className="text-xs">
                      <span className="text-base-content block">{b.invitee_name}</span>
                      <span className="text-[10px] text-base-content/50 block truncate max-w-[180px]">
                        {b.invitee_email}
                      </span>
                    </td>
                    <td>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[b.status] || "badge-ghost"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-xs font-normal"
                        onClick={() => setSelectedBooking(b)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Booking Links */}
      {activeEventTypes.length > 0 && (
        <div className="bg-neutral-50/60 dark:bg-neutral-900/40 border border-base-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-base-content/70">
              Active Booking Links
            </h3>
            <Link to="/event-types" className="text-xs text-primary hover:underline font-medium">
              Manage →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeEventTypes.map((et) => (
              <div
                key={et.id}
                className="bg-base-100 border border-base-200 rounded-md p-3 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs text-base-content truncate">{et.title}</span>
                    <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-base-content/60 px-1.5 py-0.5 rounded">
                      {et.duration} min
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-base-content/40 truncate mt-0.5">
                    /book/{user?.username}/{et.slug}
                  </p>
                </div>
                <div className="flex gap-1.5 pt-2 border-t border-base-200">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost border border-base-200 flex-1 text-xs font-normal rounded"
                    onClick={() => copyBookingLink(et.slug)}
                  >
                    <Copy className="w-3 h-3 text-base-content/50" />
                    Copy
                  </button>
                  <a
                    href={`/book/${user?.username}/${et.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-ghost border border-base-200 text-xs font-normal rounded px-2"
                  >
                    <ExternalLink className="w-3 h-3 text-base-content/50" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        isOpen={Boolean(selectedBooking)}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancelBooking={(b) => setBookingToCancel(b)}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bookingToCancel)}
        title="Cancel Meeting"
        message={`Are you sure you want to cancel the meeting with ${bookingToCancel?.invitee_name}? An email notification will be sent.`}
        confirmLabel="Cancel Meeting"
        confirmVariant="btn-error"
        isLoading={cancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => setBookingToCancel(null)}
      />
    </div>
  );
}