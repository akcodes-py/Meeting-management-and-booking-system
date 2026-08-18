import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100 text-base-content selection:bg-primary/20 selection:text-primary transition-colors duration-150">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-base-200 py-5 text-center text-xs text-base-content/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Meeting Management & Booking System</span>
          <span className="text-[11px] text-base-content/40">Real-time Google Calendar Availability</span>
        </div>
      </footer>
    </div>
  );
}