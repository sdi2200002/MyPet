import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function normRole(r) {
  const s = String(r || "").toLowerCase();
  if (s === "ιδιοκτήτης") return "owner";
  if (s === "κτηνίατρος") return "vet";
  return s;
}

export default function ProtectedRoute({ allow }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const isLoggedIn = !!(user?.id || user?.user?.id);

  if (!isLoggedIn) {
    const from = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  if (Array.isArray(allow) && allow.length > 0) {
    const role = normRole(user?.role ?? user?.user?.role);
    const allowNorm = allow.map(normRole);

    if (!allowNorm.includes(role)) {
      // λάθος ρόλος -> ζήτα login (όχι "/")
      const from = location.pathname + location.search;
      return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
    }
  }

  return <Outlet />;
}
