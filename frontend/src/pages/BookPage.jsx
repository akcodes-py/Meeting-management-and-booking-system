import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Globe,
  Video,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import {
  dateFromInput,
  formatDate,
  formatTime,
  groupSlotsByDate,
  toDateInputValue,
} from "../utils/dates";
import { useToast } from "../context/ToastContext";
import ThemeToggle from "../components/ThemeToggle";

function buildDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push(d);
  }
  return options;
}

export default function BookPage() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [eventType, setEventType] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [slotsByDate, setSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.public
      .eventType(username, slug)
      .then((res) => {
        setEventType(res.data);
      })
      .catch((err) => {
        const msg = getErrorMessage(err, "Booking page not found or inactive.");
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [username, slug]);

  useEffect(() => {
    if (!eventType) return;
    setLoadingSlots(true);
    const today = toDateInputValue(new Date());
    const end = toDateInputValue(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    api.public
      .availability(username, slug, { start_date: today, end_date: end })
      .then((res) => {
        const grouped = groupSlotsByDate(res.data?.slots || []);
        setSlotsByDate(grouped);
        // Auto-select first date with available slots
        const firstAvailable = Object.keys(grouped).find((k) => grouped[k].length > 0);
        if (firstAvailable) {
          setSelectedDate(firstAvailable);
        } else {
          setSelectedDate(today);
        }
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Could not load real-time availability."));
      })
      .finally(() => setLoadingSlots(false));
  }, [eventType, username, slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      showToast("Please select a time slot first.", "error");
      return;
    }
    setBooking(true);
    setError("");
    try {
      const res = await api.public.book(username, slug, {
        name: form.name,
        email: form.email,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      });
      showToast("Meeting booked successfully!", "success");
      navigate(`/book/${username}/${slug}/confirmation`, {
        state: { booking: res.data, hostName: eventType.host_name },
      });
    } catch (err) {
      const msg = getErrorMessage(err, "Booking failed. Please check the selected time.");
      setError(msg);
      showToast(msg, "error");
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 gap-3">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="text-xs text-base-content/60">Loading scheduling availability...</p>
      </div>
    );
  }

  if (error && !eventType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-4">
        <div className="bg-base-100 border border-base-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-base-content">Meeting Unavailable</h1>
          <p className="text-xs text-base-content/70">{error}</p>
          <Link to="/" className="btn btn-primary btn-sm text-xs rounded-lg">
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const dates = buildDateOptions();
  const currentSlots = (selectedDate && slotsByDate[selectedDate]) || [];

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col transition-colors duration-150">
      {/* Top Header */}
      <header className="border-b border-base-200 bg-base-100/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-sm text-base-content">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span>MeetingManager</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-base-content/60 hidden sm:inline">
              Host: <span className="font-semibold text-base-content">{eventType.host_name}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Booking Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Event Header Card */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-6 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-medium text-base-content/60">Schedule with {eventType.host_name}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-base-content">{eventType.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-base-content/70 pt-1">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {eventType.duration} minutes
                </span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <Video className="w-3.5 h-3.5 text-primary" />
                  {eventType.location || "Google Meet"}
                </span>
                <span className="inline-flex items-center gap-1 text-base-content/50">
                  <Globe className="w-3.5 h-3.5" />
                  {eventType.timezone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Calendar & Time Slot Flow */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Date Picker Column */}
          <div className="md:col-span-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
              1. Select Date
            </h2>
            <div className="bg-base-100 border border-base-200 rounded-2xl p-2.5 max-h-[500px] overflow-y-auto space-y-1 shadow-xs">
              {loadingSlots ? (
                <div className="py-12 text-center space-y-2">
                  <span className="loading loading-spinner loading-sm text-primary"></span>
                  <p className="text-xs text-base-content/50">Checking live availability...</p>
                </div>
              ) : (
                dates.map((d) => {
                  const key = toDateInputValue(d);
                  const count = (slotsByDate[key] || []).length;
                  const isSelected = selectedDate === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-content shadow-xs"
                          : count > 0
                          ? "hover:bg-base-200 text-base-content"
                          : "opacity-40 text-base-content/40 cursor-not-allowed"
                      }`}
                      disabled={count === 0}
                      onClick={() => {
                        setSelectedDate(key);
                        setSelectedSlot(null);
                      }}
                    >
                      <span>{formatDate(d.toISOString())}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-primary-content/20 text-primary-content font-bold"
                            : count > 0
                            ? "bg-base-200 text-base-content/70"
                            : "text-base-content/40"
                        }`}
                      >
                        {count} slot{count === 1 ? "" : "s"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Time Slots & Form Column */}
          <div className="md:col-span-7 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              2. Select Slot & Book
            </h2>

            {selectedSlot ? (
              /* Booking Form */
              <div className="bg-base-100 border border-base-200 rounded-2xl p-6 space-y-5 shadow-xs animate-in fade-in duration-150">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                      Selected Slot
                    </span>
                    <span className="font-semibold text-xs text-base-content">
                      {formatDate(selectedSlot.start)} at {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-xs text-primary"
                    onClick={() => setSelectedSlot(null)}
                    disabled={booking}
                  >
                    Change Slot
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-base-content">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      className="input input-bordered input-sm w-full text-xs rounded-lg"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-base-content">
                      Your Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      className="input input-bordered input-sm w-full text-xs rounded-lg"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                    <span className="text-[11px] text-base-content/50 block">
                      A calendar invitation and Google Meet link will be sent to this email.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-base-200">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs rounded-lg"
                      onClick={() => setSelectedSlot(null)}
                      disabled={booking}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm text-xs font-medium rounded-lg shadow-xs"
                      disabled={booking}
                    >
                      {booking ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Confirming...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedDate ? (
              /* Slots Grid */
              <div className="bg-base-100 border border-base-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="border-b border-base-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-base-content">
                      Available times on {formatDate(dateFromInput(selectedDate).toISOString())}
                    </h3>
                    <p className="text-[11px] text-base-content/50">
                      Times displayed in your host's timezone ({eventType.timezone})
                    </p>
                  </div>
                </div>

                {currentSlots.length === 0 ? (
                  <div className="py-12 text-center text-xs text-base-content/50">
                    No free slots available on this date. Please pick another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {currentSlots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        className="py-2.5 px-3 rounded-xl border border-base-300 hover:border-primary hover:bg-primary/10 hover:text-primary text-xs font-semibold transition-all duration-150 text-center cursor-pointer shadow-xs active:scale-95"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-base-100 border border-base-200 rounded-2xl p-12 text-center text-xs text-base-content/50 shadow-xs">
                Select a date from the calendar on the left to view free appointment times.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}