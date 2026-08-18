import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { isLoggedIn } from "../services/auth";
import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  const authed = isLoggedIn();

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col transition-colors duration-150">
      {/* Header */}
      <header className="border-b border-base-200 bg-base-100/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base text-base-content">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <span>MeetingManager</span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {authed ? (
              <Link
                to="/dashboard"
                className="btn btn-primary btn-sm text-xs font-medium rounded-lg shadow-xs gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-base-content/80 hover:text-base-content hover:bg-base-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm text-xs font-medium rounded-lg shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* Hero Section */}
        <div className="space-y-5 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Meeting Management & Real-Time Booking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-content leading-tight">
            Effortless meeting scheduling with Google Calendar sync
          </h1>
          <p className="text-sm text-base-content/70 leading-relaxed max-w-xl mx-auto">
            Eliminate back-and-forth emails. Share your personalized booking link, let guests pick from real-time available slots, and automatically generate Google Meet calls.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            {authed ? (
              <Link to="/dashboard" className="btn btn-primary btn-md text-xs rounded-xl shadow-xs gap-2">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-md text-xs rounded-xl shadow-xs gap-1.5">
                  <span>Create Host Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/login" className="btn btn-outline btn-md text-xs rounded-xl">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-base-100 border border-base-200 rounded-2xl p-5 space-y-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-base-content">Conflict-Free Sync</h3>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Connects with Google Calendar to read real-time busy blocks and prevent double bookings.
            </p>
          </div>

          <div className="bg-base-100 border border-base-200 rounded-2xl p-5 space-y-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-base-content">Custom Event Types</h3>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Create 15, 30, or 60 minute meeting links with custom buffer times and weekly schedules.
            </p>
          </div>

          <div className="bg-base-100 border border-base-200 rounded-2xl p-5 space-y-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-base-content">Auto Google Meet</h3>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Every confirmed booking automatically generates a video call link and sends invites to all attendees.
            </p>
          </div>
        </div>

        {/* Workflow Overview */}
        <div className="grid sm:grid-cols-2 gap-6 pt-8 border-t border-base-200">
          <div className="bg-base-100 border border-base-200 rounded-2xl p-6 space-y-3.5 shadow-xs">
            <h2 className="font-bold text-sm text-base-content flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                1
              </span>
              For Hosts
            </h2>
            <ul className="text-xs text-base-content/70 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Configure custom event types (duration, buffers, locations)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Define weekly recurring availability windows per event type</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Sync with Google Calendar for automatic conflict detection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Share public booking links with guests, clients, or team members</span>
              </li>
            </ul>
          </div>

          <div className="bg-base-100 border border-base-200 rounded-2xl p-6 space-y-3.5 shadow-xs">
            <h2 className="font-bold text-sm text-base-content flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                2
              </span>
              For Invitees
            </h2>
            <ul className="text-xs text-base-content/70 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Open the host's booking link seamlessly on mobile or desktop</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>View open time slots dynamically in real time without creating an account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Book a slot with name and email in under 10 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Receive instant calendar invitations with Google Meet video links</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-base-200 py-6 text-center text-xs text-base-content/50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Meeting Management & Booking System</span>
          <span className="text-[11px] text-base-content/40">Powered by Django REST Framework & React</span>
        </div>
      </footer>
    </div>
  );
}