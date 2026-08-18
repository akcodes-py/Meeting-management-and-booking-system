import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookPage from "./pages/BookPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import Dashboard from "./pages/Dashboard";
import EventTypes from "./pages/EventTypes";
import EventTypeForm from "./pages/EventTypeForm";
import Availability from "./pages/Availability";
import Bookings from "./pages/Bookings";
import Settings from "./pages/Settings";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/book/:username/:slug" element={<BookPage />} />
          <Route path="/book/:username/:slug/confirmation" element={<BookingConfirmation />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/event-types" element={<EventTypes />} />
            <Route path="/event-types/new" element={<EventTypeForm />} />
            <Route path="/event-types/:id/edit" element={<EventTypeForm />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
}