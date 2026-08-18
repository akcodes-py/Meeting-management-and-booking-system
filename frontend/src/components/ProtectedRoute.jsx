import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../services/auth";

// Wraps host pages; redirects to /login when there is no JWT.
export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}