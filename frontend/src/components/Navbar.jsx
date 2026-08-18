import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Calendar, LayoutDashboard, Clock, Layers, Settings as SettingsIcon, LogOut, Menu, X } from "lucide-react";
import { getUser, isLoggedIn, logout } from "../services/auth";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const authed = isLoggedIn();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
      isActive
        ? "bg-neutral-100 dark:bg-neutral-800 text-primary font-semibold"
        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-neutral-100 dark:bg-neutral-800 text-primary font-semibold"
        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    }`;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="bg-base-100 border-b border-base-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-6">
            <Link
              to={authed ? "/dashboard" : "/"}
              className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-tight text-base-content"
            >
              <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 text-primary flex items-center justify-center border border-base-200">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base-content tracking-tight">MeetingManager</span>
            </Link>

            {/* Desktop Navigation */}
            {authed && (
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/bookings" className={navLinkClass}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Meetings</span>
                </NavLink>
                <NavLink to="/event-types" className={navLinkClass}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Event Types</span>
                </NavLink>
                <NavLink to="/availability" className={navLinkClass}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Availability</span>
                </NavLink>
                <NavLink to="/settings" className={navLinkClass}>
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </NavLink>
              </nav>
            )}
          </div>

          {/* Right actions: Theme Toggle + User Info / Actions */}
          <div className="flex items-center gap-2.5">
            {/* Exactly positioned circular theme button */}
            <ThemeToggle />

            {authed ? (
              <>
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-base-200">
                  <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-base-200 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center">
                    {initials}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-base-content leading-tight line-clamp-1 max-w-[120px]">
                      {user?.name || "Host"}
                    </span>
                    <span className="text-[10px] text-base-content/50 leading-tight line-clamp-1 max-w-[120px]">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-base-content/60 hover:text-base-content hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>

                {/* Mobile hamburger */}
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md border border-base-200 text-base-content/80 hover:bg-base-200"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm text-xs font-medium rounded-md shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {authed && mobileMenuOpen && (
          <div className="md:hidden border-t border-base-200 py-2.5 space-y-1">
            <div className="px-3 py-2 text-xs text-base-content/70 border-b border-base-200 mb-1 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex items-center justify-center border border-base-200">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base-content">{user?.name}</span>
                <span className="text-[10px] text-base-content/50">{user?.email}</span>
              </div>
            </div>

            <NavLink
              to="/dashboard"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/bookings"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="w-4 h-4" />
              <span>Meetings</span>
            </NavLink>
            <NavLink
              to="/event-types"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers className="w-4 h-4" />
              <span>Event Types</span>
            </NavLink>
            <NavLink
              to="/availability"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Clock className="w-4 h-4" />
              <span>Availability</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>

            <div className="pt-2 border-t border-base-200">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-base-content/70 hover:bg-base-200 transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}