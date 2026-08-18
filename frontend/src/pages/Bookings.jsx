import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Search,
  Video,
  X,
  ArrowLeft,
  AlertCircle,
  CalendarX,
} from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { formatDateTime, formatTime, formatDate, isToday, isUpcoming } from "../utils/dates";
import { useToast } from "../context/ToastContext";
import MeetingDetailsModal from "../components/MeetingDetailsModal";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_BADGE = {
  CONFIRMED: "bg-neutral-100 dark:bg-neutral-800 text-primary border border-neutral-200 dark:border-neutral-700",
  PENDING: "bg-neutral-100 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-neutral-700",
  CANCELLED: "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700 line-through",
  FAILED: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700",
};

export default function Bookings() {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadBookings = () => {
    setLoading(true);
    api.bookings
      .list()
      .then((res) => {
        setBookings(res.data || []);
      })
      .catch((err) => {
        const msg = getErrorMessage(err);
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadBookings, []);

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await api.bookings.cancel(bookingToCancel.id);
      showToast("Meeting cancelled successfully.", "success");
      setBookingToCancel(null);
      setSelectedBooking(null);
      loadBookings();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not cancel booking."), "error");
    } finally {
      setCancelling(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (b.event_type || "").toLowerCase().includes(q);
        const matchName = (b.invitee_name || "").toLowerCase().includes(q);
        const matchEmail = (b.invitee_email || "").toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchEmail) return false;
      }

      // Status
      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }

      // Time
      if (timeFilter === "TODAY") {
        if (!isToday(b.start_time)) return false;
      } else if (timeFilter === "UPCOMING") {
        if (!isUpcoming(b.start_time)) return false;
      } else if (timeFilter === "PAST") {
        if (isUpcoming(b.start_time)) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter, timeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTimeFilter("ALL");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "ALL" || timeFilter !== "ALL";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-md w-1/4"></div>
        <div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
        <div className="h-80 bg-neutral-100 dark:bg-neutral-800 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-base-content">Meetings</h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Total {bookings.length} meeting{bookings.length === 1 ? "" : "s"} scheduled.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="btn btn-ghost btn-sm gap-1.5 text-xs font-normal self-start sm:self-auto rounded-md border border-base-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-base-200 text-rose-600 dark:text-rose-400 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-base-100 border border-base-200 rounded-lg p-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by name, email, or meeting..."
              className="input input-bordered input-sm w-full pl-8 text-xs rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time Filter Dropdown */}
          <select
            className="select select-bordered select-sm text-xs rounded-md min-w-[120px]"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="ALL">All Time</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="TODAY">Today</option>
            <option value="PAST">Past</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            className="select select-bordered select-sm text-xs rounded-md min-w-[130px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-ghost btn-sm text-xs text-base-content/60 hover:text-base-content"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-base-200 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <span className="text-[11px] font-medium text-base-content/60">
            {filteredBookings.length} {filteredBookings.length === 1 ? "Meeting" : "Meetings"}
          </span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-base-content/40 flex items-center justify-center mx-auto">
              <CalendarX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-base-content">No meetings found</p>
              <p className="text-[11px] text-base-content/50 mt-0.5">
                {hasActiveFilters
                  ? "Try resetting your search query or filters."
                  : "Share your booking link to start scheduling meetings."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-ghost border border-base-200 btn-xs text-xs rounded mt-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-[11px] font-medium text-base-content/50 border-b border-base-200">
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th>Meeting</th>
                  <th>Invitee</th>
                  <th>Status</th>
                  <th className="text-right px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <span className="font-medium text-base-content block">{formatDate(b.start_time)}</span>
                      <span className="text-[10px] text-base-content/50 block">
                        {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-xs text-base-content block">{b.event_type}</span>
                      {b.meet_link ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                          <Video className="w-3 h-3" />
                          Google Meet
                        </span>
                      ) : (
                        <span className="text-[10px] text-base-content/40 block">Standard</span>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-xs font-normal"
                          onClick={() => setSelectedBooking(b)}
                        >
                          Details
                        </button>
                        {b.status !== "CANCELLED" && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-xs text-rose-600 hover:bg-rose-500/10 font-normal"
                            onClick={() => setBookingToCancel(b)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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