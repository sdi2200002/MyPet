import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * Protect routes based on authentication (and optional role).
 *
 * Usage:
 * <Route element={<ProtectedRoute allow={["owner"]} />}>
 *    <Route path="/owner" element={<OwnerDashboard />} />
 * </Route>
 */
export default function ProtectedRoute({ allow }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // αν έχεις loading state στο AuthContext, περίμενε να τελειώσει
  if (loading) return null;

  const isLoggedIn = !!(user?.id || user?.user?.id);

  if (!isLoggedIn) {
    // κράτα το που πήγαινε για να γυρίσει μετά το login
    const from = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  // role check (αν δώσεις allow)
  if (Array.isArray(allow) && allow.length > 0) {
    const role = user?.role ?? user?.user?.role ?? "";
    if (!allow.includes(role)) {
      // logged in αλλά λάθος ρόλος -> στείλ'τον στην αρχική
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
